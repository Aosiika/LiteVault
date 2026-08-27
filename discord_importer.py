"""
discord_importer.py — Descargador e importador masivo de litemáticas desde Discord a LiteVault.
"""

from __future__ import annotations

import os
import re
import sys
import time
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import httpx

# Configurar encoding utf-8 para consola Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Asegurar path de litevault
_ROOT = Path(__file__).resolve().parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from sqlmodel import select

from app.config import SCHEMATICS_DIR
from app.db.database import create_db_and_tables, get_session
from app.db.models import Category, Schematic, SchematicTagLink, Tag
from app.services import file_service, schematic_service, thumbnail_service

TOKEN = ""
GUILD_ID = ""
BASE_URL = "https://discord.com/api/v9"

HEADERS = {
    "Authorization": TOKEN,
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

client = httpx.Client(timeout=45.0)


def api_get(endpoint: str, params: Optional[dict] = None) -> httpx.Response:
    """Realiza una petición GET a la API de Discord respetando Rate-Limits (429)."""
    url = f"{BASE_URL}{endpoint}"
    while True:
        try:
            resp = client.get(url, headers=HEADERS, params=params)
            if resp.status_code == 429:
                retry_after = resp.json().get("retry_after", 2.0)
                print(f"⏳ Rate-limit alcanzado. Esperando {retry_after:.1f}s…", flush=True)
                time.sleep(retry_after + 0.5)
                continue
            return resp
        except Exception as err:
            print(f"⚠ Reintentando conexión ({err})…", flush=True)
            time.sleep(1.0)


def normalize_name(name: str) -> str:
    """Normaliza nombres de canales/categorías para comparación."""
    return re.sub(r"[^a-z0-9]", "", name.lower())


def build_category_lookup() -> Dict[str, int]:
    """Construye un mapa de búsqueda de nombres de subcategorías a IDs en LiteVault."""
    lookup: Dict[str, int] = {}
    with get_session() as session:
        cats = session.exec(select(Category)).all()
        for cat in cats:
            lookup[normalize_name(cat.name)] = cat.id
            lookup[cat.name.lower()] = cat.id
    return lookup


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


def run_import():
    """Ejecuta el proceso completo de descarga e importación."""
    print("=" * 65, flush=True)
    print("💎 LiteVault — Importador Automático desde Discord", flush=True)
    print("=" * 65, flush=True)

    create_db_and_tables()
    category_lookup = build_category_lookup()
    tag_map = build_tag_lookup()

    with get_session() as session:
        existing_names: Set[str] = {
            s.name.lower().strip()
            for s in session.exec(select(Schematic.name)).all()
            if s.name
        }

    print(f"\n📡 Conectando al servidor {GUILD_ID}…", flush=True)
    res = api_get(f"/guilds/{GUILD_ID}/channels")
    if not res.is_success:
        print(f"❌ Error al obtener canales ({res.status_code}): {res.text}", flush=True)
        return

    channels = res.json()
    print(f"✓ Se encontraron {len(channels)} canales en el servidor.\n", flush=True)

    parent_map = {c["id"]: c["name"] for c in channels if c.get("type") == 4}
    total_downloaded = 0
    total_skipped = 0

    temp_dir = _ROOT / "temp_discord_downloads"
    temp_dir.mkdir(parents=True, exist_ok=True)

    VALID_PARENT_CATEGORIES = {
        "MONSTERS",
        "CREATURES",
        "AGRICULTURE",
        "BLOCKS & ITEMS",
        "ITEM PROCESSING",
        "INFRASTRUCTURE",
        "NICHE & LEGACY",
    }

    # Filtrar únicamente los canales que pertenecen a las 7 categorías principales
    schematic_channels = []
    for c in channels:
        pname = parent_map.get(c.get("parent_id"), "").strip()
        if pname in VALID_PARENT_CATEGORIES and c.get("type") in (0, 5, 15):
            schematic_channels.append((pname, c))

    print(f"✓ Canales de esquemas a procesar: {len(schematic_channels)}\n", flush=True)

    for ch_idx, (pname, ch) in enumerate(schematic_channels, 1):
        ch_id = ch["id"]
        ch_name = ch.get("name", "")
        ch_type = ch.get("type")

        # Determinar ID de subcategoría en LiteVault
        cat_id = None
        for cand in [ch_name, normalize_name(ch_name)]:
            if cand in category_lookup:
                cat_id = category_lookup[cand]
                break

        print(f"\n[{ch_idx}/{len(schematic_channels)}] 📂 [{pname}] #{ch_name} (Cat ID: {cat_id})", flush=True)

        # Recopilar hilos si es canal foro (15) o canal regular (0, 5)
        threads_to_process = []
        if ch_type == 15:
            offset = 0
            while True:
                r_th = api_get(f"/channels/{ch_id}/threads/search?limit=25&offset={offset}")
                if not r_th.is_success:
                    break
                th_data = r_th.json()
                thread_list = th_data.get("threads", [])
                if not thread_list:
                    break
                threads_to_process.extend(thread_list)
                if not th_data.get("has_more", False) or len(thread_list) < 25:
                    break
                offset += 25
        else:
            threads_to_process = [{"id": ch_id, "name": ch_name}]

        print(f"  -> {len(threads_to_process)} construcciones/hilos encontrados", flush=True)

        for t in threads_to_process:
            t_id = t.get("id")
            t_name = t.get("name", ch_name)

            # Obtener mensajes del hilo/canal
            r_msg = api_get(f"/channels/{t_id}/messages?limit=50")
            if not r_msg.is_success:
                continue

            messages = r_msg.json()
            if not isinstance(messages, list):
                continue

            for msg in messages:
                content = msg.get("content", "")
                attachments = msg.get("attachments", [])

                # Extraer URLs de litematics
                schematic_urls: List[Tuple[str, str]] = []  # (filename, url)

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

                    # O(1) instant in-memory check
                    if clean_name.lower() in existing_names:
                        total_skipped += 1
                        continue

                    tmp_file = temp_dir / f"{clean_name}.litematic"

                    try:
                        print(f"  📥 Descargando: {clean_name}.litematic…", flush=True)
                        r_dl = client.get(url)
                        if r_dl.status_code == 200 and len(r_dl.content) > 0:
                            with open(tmp_file, "wb") as f_out:
                                f_out.write(r_dl.content)

                            # Detectar tags
                            tags_to_apply = detect_tags(f"{t_name} {content}", clean_name, tag_map)

                            # Importar a LiteVault
                            schem = file_service.import_schematic(
                                src_path=tmp_file,
                                name=clean_name,
                                category_id=cat_id,
                            )

                            # Asignar tags y descripción
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
                            print(f"  ✨ Importado: «{clean_name}» (Cat: {cat_id}, Tags: {len(tags_to_apply)})", flush=True)
                    except Exception as exc:
                        print(f"  ⚠ Error con {clean_name}: {exc}", flush=True)
                    finally:
                        if tmp_file.exists():
                            try:
                                tmp_file.unlink()
                            except Exception:
                                pass

    print("\n" + "=" * 65, flush=True)
    print("🎉 Importación masiva completada con éxito:", flush=True)
    print(f"   • {total_downloaded} nuevas litemáticas añadidas a LiteVault.", flush=True)
    print(f"   • {total_skipped} esquemas ya existentes omitidos.", flush=True)
    print("=" * 65, flush=True)


if __name__ == "__main__":
    run_import()
