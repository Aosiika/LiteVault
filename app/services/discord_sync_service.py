"""
discord_sync_service.py — Servicio de sincronización inteligente con cualquier servidor de Discord.
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
import urllib.parse
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import httpx
from sqlmodel import select

from app.config import BASE_DIR, SCHEMATICS_DIR, STORAGE_DIR
from app.db.database import create_db_and_tables, get_session
from app.db.models import Category, Schematic, SchematicTagLink, Tag
from app.services import file_service

logger = logging.getLogger(__name__)

CONFIG_PATH = STORAGE_DIR / "discord_config.json"
DEFAULT_GUILD_OR_INVITE = ""
DEFAULT_TOKEN = ""
BASE_URL = "https://discord.com/api/v9"


def load_discord_config() -> dict:
    """Carga la configuración de Discord (token, invite_or_guild_id) desde storage/discord_config.json."""
    if CONFIG_PATH.exists():
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "token": DEFAULT_TOKEN,
        "invite_or_guild": DEFAULT_GUILD_OR_INVITE,
        "last_sync": None,
    }


def save_discord_config(token: str, invite_or_guild: Optional[str] = None) -> None:
    """Guarda la configuración en storage/discord_config.json."""
    cfg = load_discord_config()
    cfg["token"] = token.strip()
    if invite_or_guild:
        cfg["invite_or_guild"] = invite_or_guild.strip()
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2, ensure_ascii=False)


def normalize_name(name: str) -> str:
    """Normaliza nombres de canales/categorías para comparación."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


async def resolve_guild(client: httpx.AsyncClient, invite_or_id: str, headers: dict) -> Tuple[str, str]:
    """
    Resuelve el ID y nombre del servidor de Discord a partir de:
    - Enlace de invitación (ej: https://discord.gg/nkGFgD2YW o nkGFgD2YW)
    - ID numérico del servidor (ej: 1161803566265143306)
    """
    cleaned = invite_or_id.strip()
    # Si es un enlace de invitación
    code_match = re.search(r"(?:discord\.gg/|discord\.com/invite/)?([a-zA-Z0-9\-]+)$", cleaned)
    if code_match and not cleaned.isdigit():
        code = code_match.group(1)
        r = await client.get(f"{BASE_URL}/invites/{code}", headers=headers)
        if r.is_success:
            data = r.json()
            guild = data.get("guild", {})
            return str(guild.get("id")), str(guild.get("name", "Servidor de Discord"))

    # Si es un ID directo o fallback
    if cleaned.isdigit():
        r = await client.get(f"{BASE_URL}/guilds/{cleaned}", headers=headers)
        if r.is_success:
            data = r.json()
            return str(data.get("id")), str(data.get("name", "Servidor de Discord"))
        return cleaned, "Servidor de Discord"

    return cleaned, "Servidor de Discord"


def ensure_category_hierarchy(session, path_segments: List[str]) -> Optional[int]:
    """
    Crea dinámicamente la jerarquía de categorías a partir de una lista de nombres.
    Devuelve el ID de la categoría final (hoja).
    """
    parent_id = None
    for name in path_segments:
        if not name or not name.strip():
            continue
        clean_name = name.strip()
        
        # Buscar subcategoría bajo el padre actual
        query = select(Category).where(Category.name.ilike(clean_name))
        if parent_id is None:
            query = query.where(Category.parent_id == None)
        else:
            query = query.where(Category.parent_id == parent_id)
            
        cat = session.exec(query).first()
        
        if not cat:
            cat = Category(name=clean_name, parent_id=parent_id)
            session.add(cat)
            session.commit()
            session.refresh(cat)
            
        parent_id = cat.id
        
    return parent_id


def build_tag_lookup() -> Dict[str, int]:
    """Construye un mapa de tags para detección automática de palabras clave."""
    tag_map: Dict[str, int] = {}
    with get_session() as session:
        tags = session.exec(select(Tag)).all()
        for t in tags:
            tag_map[t.name.lower()] = t.id
    return tag_map


def detect_tags(text: str, file_name: str, tag_map: Dict[str, int]) -> List[int]:
    """Detecta tags basados en el texto del mensaje y el nombre del archivo."""
    combined = f"{text} {file_name}".lower()
    matched_ids: Set[int] = set()

    keywords = {
        "redstone": "redstone",
        "farm": "farm",
        "granja": "farm",
        "storage": "storage",
        "almacen": "storage",
        "chest": "storage",
        "auto": "automated",
        "automated": "automated",
        "compact": "compact",
        "compacta": "compact",
        "survival": "survival-friendly",
        "nether": "nether",
        "end": "end",
        "overworld": "overworld",
        "villager": "villager",
        "aldeano": "villager",
        "iron": "iron",
        "hierro": "iron",
        "xp": "xp",
        "exp": "xp",
        "furnace": "furnace",
        "horno": "furnace",
        "flying": "flying-machine",
        "voladora": "flying-machine",
        "duper": "glitch-duper",
        "dupe": "glitch-duper",
        "decor": "decoration",
        "quarry": "quarry-world-eater",
        "world eater": "quarry-world-eater",
        "tnt": "quarry-world-eater",
        "potion": "potion",
        "pocion": "potion",
    }

    for kw, tag_name in keywords.items():
        if kw in combined and tag_name in tag_map:
            matched_ids.add(tag_map[tag_name])

    return list(matched_ids)


async def sync_discord_async(
    progress_callback: Optional[Callable[[str, int, int], None]] = None
) -> Tuple[int, int, str]:
    """
    Ejecuta la sincronización asíncrona con cualquier servidor de Discord.
    """
    create_db_and_tables()
    cfg = load_discord_config()
    token = cfg.get("token") or DEFAULT_TOKEN
    invite_or_guild = cfg.get("invite_or_guild") or DEFAULT_GUILD_OR_INVITE

    if not token or not token.strip():
        raise ValueError("No hay un token de Discord configurado.")

    headers = {
        "Authorization": token.strip(),
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
        "Accept": "*/*",
    }

    tag_map = build_tag_lookup()

    # Cargar nombres existentes en memoria para comprobación O(1) instantánea
    with get_session() as session:
        existing_names: Set[str] = {
            s.lower().strip()
            for s in session.exec(select(Schematic.name)).all()
            if s
        }

    async with httpx.AsyncClient(timeout=45.0) as client:
        if progress_callback:
            progress_callback("Resolviendo servidor de Discord…", 0, 1)

        guild_id, guild_name = await resolve_guild(client, invite_or_guild, headers)
        if not guild_id:
            raise ValueError(f"No se pudo resolver el servidor de Discord desde: {invite_or_guild}")

        if progress_callback:
            progress_callback(f"Conectado a «{guild_name}» ({guild_id})…", 0, 1)

        # 1. Obtener canales
        r = await client.get(f"{BASE_URL}/guilds/{guild_id}/channels", headers=headers)
        if r.status_code == 401:
            raise ValueError("Token de Discord inválido o expirado.")
        if not r.is_success:
            raise RuntimeError(f"Error al acceder a canales ({r.status_code}): {r.text}")

        channels = r.json()
        parent_map = {c["id"]: c["name"] for c in channels if c.get("type") == 4}

        # Canales de texto, anuncios, foros o media
        schematic_channels = [
            (parent_map.get(c.get("parent_id"), ""), c)
            for c in channels
            if c.get("type") in (0, 5, 15, 16)
        ]

        total_channels = len(schematic_channels)
        total_downloaded = 0
        total_skipped = 0

        temp_dir = STORAGE_DIR / "temp_sync"
        temp_dir.mkdir(parents=True, exist_ok=True)

        for ch_idx, (pname, ch) in enumerate(schematic_channels, 1):
            ch_id = ch["id"]
            ch_name = ch.get("name", "")
            ch_type = ch.get("type")

            if progress_callback:
                progress_callback(f"[{ch_idx}/{total_channels}] #{ch_name} ({pname or 'General'})", ch_idx, total_channels)

            threads_to_process = []
            if ch_type in (15, 16):
                # 1. Obtener hilos activos del servidor y filtrar por este canal
                r_active = await client.get(f"{BASE_URL}/guilds/{guild_id}/threads/active", headers=headers)
                if r_active.is_success:
                    active_th = r_active.json().get("threads", [])
                    threads_to_process.extend([t for t in active_th if t.get("parent_id") == ch_id])
                
                # 2. Obtener hilos archivados de este canal (foro/media)
                before_date = None
                while True:
                    url = f"{BASE_URL}/channels/{ch_id}/threads/archived/public?limit=100"
                    if before_date:
                        url += f"&before={before_date}"
                    
                    r_arch = await client.get(url, headers=headers)
                    if not r_arch.is_success:
                        break
                    
                    arch_data = r_arch.json()
                    th_list = arch_data.get("threads", [])
                    threads_to_process.extend(th_list)
                    
                    if not arch_data.get("has_more") or not th_list:
                        break
                    
                    meta = th_list[-1].get("thread_metadata", {})
                    before_date = meta.get("archive_timestamp")
                    if not before_date:
                        break
            else:
                threads_to_process = [{"id": ch_id, "name": ch_name}]

            for t in threads_to_process:
                t_id = t.get("id")
                t_name = t.get("name", ch_name)

                # Construir la jerarquía completa: Server -> Parent -> Channel -> Thread
                path_segments = [guild_name]
                if pname:
                    path_segments.append(pname)
                
                if ch_type in (15, 16) and t_name != ch_name:
                    path_segments.append(ch_name)
                    path_segments.append(t_name)
                else:
                    path_segments.append(ch_name)

                if ch_type in (15, 16):
                    # Foros/Media: buscar desde el principio del hilo (post original y primeros comentarios)
                    url = f"{BASE_URL}/channels/{t_id}/messages?after={int(t_id) - 1}&limit=10"
                else:
                    # Canales de texto: buscar los últimos 50 mensajes
                    url = f"{BASE_URL}/channels/{t_id}/messages?limit=50"

                r_msg = await client.get(url, headers=headers)
                if not r_msg.is_success:
                    continue

                messages = r_msg.json()
                if not isinstance(messages, list):
                    continue

                for msg in messages:
                    content = msg.get("content", "")
                    attachments = msg.get("attachments", [])

                    schematic_urls: List[Tuple[str, str]] = []

                    for att in attachments:
                        fn = att.get("filename", "")
                        url = att.get("url", "")
                        if fn.lower().endswith(".litematic"):
                            schematic_urls.append((fn, url))

                    for url in re.findall(r"https?://[^\s\)\>\]]+\.litematic", content):
                        parsed = urllib.parse.urlparse(url)
                        fn = Path(parsed.path).name
                        if fn and fn.lower().endswith(".litematic"):
                            schematic_urls.append((fn, url))

                    for fn, url in schematic_urls:
                        clean_name = Path(fn).stem
                        clean_name = re.sub(r'[\\/*?:"<>|]', "", clean_name).strip()
                        if not clean_name:
                            clean_name = f"schematic_{int(time.time())}"

                        # Comprobación O(1) instantánea en memoria sin descargar nada
                        if clean_name.lower() in existing_names:
                            total_skipped += 1
                            continue

                        tmp_file = temp_dir / f"{clean_name}.litematic"

                        try:
                            if progress_callback:
                                progress_callback(f"Descargando: {clean_name}…", ch_idx, total_channels)

                            r_dl = await client.get(url)
                            if r_dl.status_code == 200 and len(r_dl.content) > 0:
                                # Garantizamos la jerarquía de categorías SOLO si descargamos algo con éxito
                                cat_id = None
                                with get_session() as session:
                                    cat_id = ensure_category_hierarchy(session, path_segments)

                                with open(tmp_file, "wb") as f_out:
                                    f_out.write(r_dl.content)

                                tags_to_apply = detect_tags(f"{t_name} {content}", clean_name, tag_map)

                                schem = file_service.import_schematic(
                                    src_path=tmp_file,
                                    name=clean_name,
                                    category_id=cat_id,
                                )

                                with get_session() as session:
                                    db_s = session.get(Schematic, schem.id)
                                    if db_s:
                                        if content:
                                            db_s.description = f"[{t_name}]\n{content[:400]}"
                                            session.add(db_s)
                                        for tid in tags_to_apply:
                                            session.add(SchematicTagLink(schematic_id=schem.id, tag_id=tid))
                                        session.commit()

                                total_downloaded += 1
                                existing_names.add(clean_name.lower())
                        except Exception as exc:
                            logger.warning("Error con %s: %s", clean_name, exc)
                        finally:
                            if tmp_file.exists():
                                try:
                                    tmp_file.unlink()
                                except Exception:
                                    pass

        cfg["last_sync"] = int(time.time())
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)

        resumen = f"Sincronización completada de «{guild_name}»: {total_downloaded} nuevas litemáticas añadidas ({total_skipped} omitidas)."
        if progress_callback:
            progress_callback(resumen, total_channels, total_channels)

        return total_downloaded, total_skipped, resumen
