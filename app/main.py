"""
main.py — Punto de entrada de LiteVault (Modo Nativo NiceGUI).

Stack: NiceGUI nativo (pywebview) + SQLModel + Nucleation (metadata & thumbnails)
Diseño: Inspirado en Modrinth y estética Minecraft.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

# Asegurar que el directorio raíz de litevault esté en sys.path
_ROOT_DIR = Path(__file__).resolve().parent.parent
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))

from fastapi import Response
from fastapi.responses import FileResponse
from nicegui import app, ui

from app.config import (
    APP_TITLE,
    COLORS,
    SCHEMATICS_DIR,
    STATIC_DIR,
    STORAGE_DIR,
    THUMBNAILS_DIR,
    WINDOW_HEIGHT,
    WINDOW_WIDTH,
)
from app.db.database import create_db_and_tables

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Servir storage, visor 3D y texturas en FastAPI / NiceGUI a nivel de módulo
app.add_static_files("/storage", str(STORAGE_DIR))
app.add_static_files("/viewer3d", str(STATIC_DIR / "viewer3d"))
app.add_static_files("/textures", str(STATIC_DIR / "textures"))
app.add_static_files("/static", str(STATIC_DIR))


# CSS Global (Estética Minecraft & Modrinth) ──────────────────────────────



# API Endpoints ───────────────────────────────────────────────────────────

@app.get("/api/schematics/{schematic_id}/file")
async def serve_schematic_file(schematic_id: int):
    """Sirve el archivo .litematic para descarga o visualización."""
    from app.db.database import get_session
    from app.db.models import Schematic

    with get_session() as session:
        schem = session.get(Schematic, schematic_id)
        if not schem:
            return Response(status_code=404)
        file_path = Path(schem.file_path)
        if not file_path.exists():
            return Response(status_code=404)
        return FileResponse(
            path=str(file_path),
            media_type="application/octet-stream",
            filename=file_path.name,
            headers={"Cross-Origin-Resource-Policy": "cross-origin"},
        )


@app.get("/api/icon/{item_name}")
async def serve_icon(item_name: str):
    """Sirve el icono de un bloque/ítem directamente desde pack.zip, con alias y búsqueda parcial."""
    import zipfile
    import io
    from fastapi.responses import StreamingResponse

    clean_name = item_name.replace("minecraft:", "")
    pack_path = STATIC_DIR / "viewer3d" / "pack.zip"
    
    if not pack_path.exists():
        return Response(status_code=404)

    try:
        with zipfile.ZipFile(pack_path, "r") as z:
            aliases = {
                "piston": "piston_side",
                "sticky_piston": "piston_top_sticky",
                "observer": "observer_front",
                "dispenser": "dispenser_front",
                "dropper": "dropper_front",
                "redstone_wall_torch": "redstone_torch",
                "redstone_wire": "redstone_dust_dot",
                "furnace": "furnace_front",
                "water": "water_still",
                "lava": "lava_still",
                "fire": "fire_0",
                "chest": "barrel_side", # Chest usa modelo 3D, usamos barrel como placeholder o planks
                "trapped_chest": "barrel_side",
            }
            
            search_name = aliases.get(clean_name, clean_name)
            
            suffixes = [
                "_stairs", "_slab", "_wall", "_fence", "_fence_gate",
                "_button", "_pressure_plate", "_trapdoor", "_door",
                "_wall_sign", "_sign", "_wall_hanging_sign", "_hanging_sign",
                "_carpet", "_wall_fan"
            ]
            for suffix in suffixes:
                if search_name.endswith(suffix):
                    base = search_name.replace(suffix, "")
                    if base in ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "bamboo", "crimson", "warped"]:
                        search_name = f"{base}_planks"
                    elif base == "stone_brick":
                        search_name = "stone_bricks"
                    elif suffix == "_carpet" and base != "moss":
                        search_name = f"{base}_wool"
                    elif suffix == "_wall_fan":
                        search_name = f"{base}_fan"
                    else:
                        search_name = base
                    break

            paths_to_try = [
                f"assets/minecraft/textures/item/{clean_name}.png",
                f"assets/minecraft/textures/item/{search_name}.png",
                f"assets/minecraft/textures/block/{search_name}.png",
                f"assets/minecraft/textures/block/{clean_name}.png",
            ]
            
            for p in paths_to_try:
                try:
                    img_data = z.read(p)
                    return StreamingResponse(io.BytesIO(img_data), media_type="image/png")
                except KeyError:
                    continue
            
            # Fuzzy search
            for f in z.namelist():
                if f.startswith("assets/minecraft/textures/") and f.endswith(".png"):
                    filename = f.split("/")[-1].replace(".png", "")
                    if filename.startswith(search_name) or filename.startswith(clean_name):
                        img_data = z.read(f)
                        return StreamingResponse(io.BytesIO(img_data), media_type="image/png")
                        
    except Exception as exc:
        logger.error("Error al extraer icono de %s: %s", clean_name, exc)
        
    # Transparente 1x1 fallback
    pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(content=pixel, media_type="image/png")


# Páginas ──────────────────────────────────────────────────────────────────

def _inject_css() -> None:
    """Inyecta el CSS global y el motor 3D Three.js en la página actual."""
    ui.add_head_html('<link rel="stylesheet" href="/static/style.css">')
    ui.add_head_html('<script type="module" src="/viewer3d/litevault-viewer.js?v=4"></script>')
    ui.add_head_html('<script src="https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js"></script>')


from app.ui.pages.settings import render_settings_page

@ui.page("/settings")
def settings_page():
    _inject_css()
    render_settings_page()


@ui.page("/")
def page_home():
    _inject_css()
    from app.ui.pages.home import HomePage
    HomePage()



# API 3D Payload (Deepslate WebGL) ────────────────────────────────────────

@app.get("/api/schematics/{schematic_id}/payload")
def get_schematic_payload(schematic_id: int):
    """Devuelve la estructura 3D en formato JSON optimizado para Deepslate WebGL."""
    import json
    import nucleation
    from app.db.database import get_session
    from app.db.models import Schematic
    from fastapi import HTTPException

    with get_session() as session:
        schem = session.get(Schematic, schematic_id)
        if not schem:
            raise HTTPException(status_code=404, detail="Schematic not found")

        actual_path = Path(schem.file_path)
        if not actual_path.exists():
            actual_path = SCHEMATICS_DIR / actual_path.name
        if not actual_path.exists():
            raise HTTPException(status_code=404, detail=f"Archivo no encontrado: {schem.name}")

        data_header = actual_path.read_bytes()[:2]
        if data_header != b'\x1f\x8b':
            raise HTTPException(status_code=400, detail="El archivo no es un .litematic válido o se descargó corrupto.")

        try:
            s = nucleation.Schematic.load_from_file(str(actual_path))
            dims = s.dimensions()
            raw_blocks = json.loads(s.get_non_air_blocks_json())

            blocks = []
            counts = {}
            for b in raw_blocks:
                name = b.get("name", "minecraft:stone")
                counts[name] = counts.get(name, 0) + 1
                props_list = b.get("properties", [])
                props = dict(props_list) if props_list else {}
                blocks.append({
                    "name": name,
                    "props": props,
                    "x": b.get("x", 0),
                    "y": b.get("y", 0),
                    "z": b.get("z", 0),
                })

            return {
                "id": schem.id,
                "name": schem.name,
                "size": [dims.x, dims.y, dims.z],
                "total_blocks": len(blocks),
                "counts": counts,
                "blocks": blocks,
            }
        except Exception as exc:
            logger.error("Error generating 3D payload for %s: %s", schem.name, exc)
            raise HTTPException(status_code=500, detail=f"Error al procesar litemática: {exc}")


# Bootstrap ───────────────────────────────────────────────────────────────

def run():
    """Entry point para desarrollo y ejecutable PyInstaller."""
    logger.info("Iniciando LiteVault…")
    create_db_and_tables()

    # Las rutas estáticas ya están configuradas a nivel de módulo arriba

    ui.run(
        title=APP_TITLE,
        port=8080,
        native=True,
        window_size=(WINDOW_WIDTH, WINDOW_HEIGHT),
        dark=True,
        reload=False,
        show=False,               # No abrir navegador del sistema — ventana nativa
        show_welcome_message=False,
        favicon="logo.ico",
        storage_secret="litevault_secret_123",
    )


if __name__ == "__main__":
    run()
