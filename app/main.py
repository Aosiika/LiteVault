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
app.add_static_files("/viewer3d", str(Path(__file__).parent / "static" / "viewer3d"))
app.add_static_files("/textures", str(Path(__file__).parent / "static" / "textures"))


# CSS Global (Estética Minecraft & Modrinth) ──────────────────────────────

GLOBAL_CSS = f"""
/* ─── Google Fonts Modernas ─── */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

/* ─── Variables de Diseño ─── */
:root {{
  --bg-base:        {COLORS['bg_base']};
  --bg-surface:     {COLORS['bg_surface']};
  --bg-card:        {COLORS['bg_card']};
  --bg-card-hover:  {COLORS['bg_card_hover']};
  --accent:         {COLORS['accent']};
  --accent-hover:   {COLORS['accent_hover']};
  --accent-light:   {COLORS['accent_light']};
  --accent-glow:    {COLORS['accent_glow']};
  --accent-purple:  {COLORS['accent_purple']};
  --accent-cyan:    {COLORS['accent_cyan']};
  --accent-gold:    {COLORS['accent_gold']};
  --text-primary:   {COLORS['text_primary']};
  --text-secondary: {COLORS['text_secondary']};
  --text-muted:     {COLORS['text_muted']};
  --border:         {COLORS['border']};
  --border-hover:   {COLORS['border_hover']};
  --success:        {COLORS['success']};
  --warning:        {COLORS['warning']};
  --danger:         {COLORS['danger']};
  --radius-xs:      4px;
  --radius-sm:      8px;
  --radius:         12px;
  --radius-lg:      16px;
  --radius-xl:      24px;
  --shadow-card:    0 4px 20px rgba(0, 0, 0, 0.45);
  --shadow-hover:   0 10px 28px rgba(0, 0, 0, 0.6), 0 0 16px rgba(27, 217, 106, 0.15);
  --transition:     all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
}}

/* ─── Reset Base ─── */
*, *::before, *::after {{ box-sizing: border-box; }}
html, body {{
  margin: 0; padding: 0;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  height: 100%;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}}

/* Scrollbar estilo Minecraft / Obsidian */
::-webkit-scrollbar {{ width: 6px; height: 6px; }}
::-webkit-scrollbar-track {{ background: var(--bg-base); }}
::-webkit-scrollbar-thumb {{
  background: var(--border);
  border-radius: 3px;
}}
::-webkit-scrollbar-thumb:hover {{ background: var(--border-hover); }}

/* ─── Layout General ─── */
.app-layout {{
  display: flex;
  height: 100vh;
  overflow: hidden;
}}

/* ─── Barra de Navegación Superior (Estilo Modrinth App) ─── */
.navbar {{
  height: 56px;
  min-height: 56px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 50;
}}
.nav-brand {{
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}}
.nav-brand-icon {{
  color: var(--accent);
  filter: drop-shadow(0 0 8px var(--accent-glow));
}}
.nav-brand-title {{
  font-family: 'Outfit', sans-serif;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text-primary);
}}
.nav-brand-title span {{
  color: var(--accent);
}}
.nav-links {{
  display: flex;
  align-items: center;
  gap: 6px;
}}
.nav-btn {{
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 14px !important;
  border-radius: var(--radius-sm) !important;
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  color: var(--text-secondary) !important;
  background: transparent !important;
  border: 1px solid transparent !important;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}}
.nav-btn:hover {{
  color: var(--text-primary) !important;
  background: var(--bg-card) !important;
  border-color: var(--border) !important;
}}
.nav-btn-active {{
  color: var(--accent-light) !important;
  background: rgba(27, 217, 106, 0.12) !important;
  border-color: rgba(27, 217, 106, 0.3) !important;
}}

/* ─── Sidebar Lateral ─── */
.sidebar {{
  width: 260px;
  min-width: 260px;
  height: calc(100vh - 56px);
  background: var(--bg-surface);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 12px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.sidebar-section-title {{
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  text-transform: uppercase;
  padding: 0 8px;
}}
.category-item {{
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition);
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}}
.category-item:hover {{
  background: var(--bg-card);
  color: var(--text-primary);
}}
.category-selected {{
  background: rgba(27, 217, 106, 0.12) !important;
  border: 1px solid rgba(27, 217, 106, 0.3);
  color: var(--accent-light) !important;
}}
.category-label {{
  font-size: 0.88rem;
  font-weight: 500;
  color: inherit;
  flex: 1;
}}
.tag-chip {{
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: #f1f5f9 !important;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  text-transform: none !important;
  user-select: none;
}}
.tag-chip:hover {{
  filter: brightness(1.15);
  transform: translateY(-1px);
}}

/* ─── Contenido Principal ─── */
.q-page {{
  display: flex !important;
  flex-direction: column !important;
  height: calc(100vh - 56px) !important;
  min-height: 0 !important;
  overflow: hidden !important;
}}
.main-content {{
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}}
.main-content-scroll {{
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}}
.page-title {{
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}}
.count-badge {{
  background: rgba(27, 217, 106, 0.15) !important;
  color: var(--accent-light) !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
  padding: 2px 8px !important;
  font-size: 0.75rem !important;
}}

/* ─── Upload Drop Zone (Estilo Minecraft Hopper) ─── */
.upload-zone-wrapper {{
  position: relative;
  background: var(--bg-surface);
  border: 1.5px dashed var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: var(--transition);
  cursor: pointer;
}}
.upload-zone-wrapper:hover {{
  border-color: var(--accent);
  background: rgba(27, 217, 106, 0.04);
  box-shadow: 0 0 16px rgba(27, 217, 106, 0.08);
}}
.upload-zone-label {{
  padding: 14px 18px;
  width: 100%;
}}
.upload-overlay {{
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}}

/* ─── Grid de Tarjetas ─── */
.schematics-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  width: 100%;
}}

/* ─── Tarjeta de Schematic (Estilo Modrinth Project Card) ─── */
.schematic-card {{
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: var(--transition);
  box-shadow: var(--shadow-card);
  position: relative;
}}
.schematic-card:hover {{
  transform: translateY(-4px);
  border-color: var(--border-hover);
  background: var(--bg-card-hover);
  box-shadow: var(--shadow-hover);
}}
.card-thumbnail-wrapper {{
  width: 100%;
  height: 150px;
  background: radial-gradient(circle at center, #262833 0%, #17181f 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border);
}}
.card-thumbnail-img {{
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 8px;
  transition: transform 0.25s ease;
}}
.schematic-card:hover .card-thumbnail-img {{
  transform: scale(1.05);
}}
.card-body {{
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  cursor: pointer;
}}
.card-title {{
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}}
.card-meta-pill {{
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 7px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(255, 255, 255, 0.05);
}}
.card-actions {{
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
  z-index: 5;
}}
.schematic-card:hover .card-actions {{
  opacity: 1;
}}
.card-delete-btn {{
  background: rgba(239, 68, 68, 0.2) !important;
  color: #ef4444 !important;
  border-radius: var(--radius-sm) !important;
}}
.card-delete-btn:hover {{
  background: rgba(239, 68, 68, 0.4) !important;
}}

/* ─── Botones Globales (Estilo Minecraft / Modrinth) ─── */
.btn-primary {{
  background: var(--accent) !important;
  color: #0b2915 !important;
  font-weight: 700 !important;
  border-radius: var(--radius-sm) !important;
  font-size: 0.85rem !important;
  transition: var(--transition);
  box-shadow: 0 2px 8px rgba(27, 217, 106, 0.25) !important;
}}
.btn-primary:hover {{
  background: var(--accent-light) !important;
  box-shadow: 0 4px 14px rgba(27, 217, 106, 0.4) !important;
}}
.btn-secondary {{
  background: var(--bg-surface) !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-sm) !important;
  font-size: 0.85rem !important;
  font-weight: 600 !important;
  transition: var(--transition);
}}
.btn-secondary:hover {{
  border-color: var(--border-hover) !important;
  background: var(--bg-card) !important;
}}
.btn-danger {{
  color: var(--danger) !important;
  background: transparent !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
  border-radius: var(--radius-sm) !important;
  font-size: 0.85rem !important;
  transition: var(--transition);
}}
.btn-danger:hover {{
  background: rgba(239, 68, 68, 0.12) !important;
}}
.btn-danger-solid {{
  background: #dc2626 !important;
  color: white !important;
  border-radius: var(--radius-sm) !important;
  font-weight: 700 !important;
  font-size: 0.85rem !important;
}}
.btn-danger-solid:hover {{
  background: #b91c1c !important;
}}
.btn-ghost-icon {{
  color: var(--text-secondary) !important;
  background: transparent !important;
}}
.btn-ghost-icon:hover {{
  color: var(--text-primary) !important;
}}

/* ─── Diálogo de Detalle & Visor (Modrinth Modal) ─── */
.viewer-dialog .q-dialog__inner {{
  padding: 20px !important;
}}
.viewer-dialog-card {{
  background: var(--bg-surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-lg) !important;
  width: 92vw !important;
  max-width: 1240px !important;
  height: 85vh !important;
  max-height: 780px !important;
  padding: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8) !important;
}}
.viewer-header {{
  padding: 14px 20px !important;
  border-bottom: 1px solid var(--border) !important;
  background: var(--bg-surface) !important;
  flex-shrink: 0 !important;
}}
.viewer-title {{
  font-family: 'Outfit', sans-serif !important;
  font-size: 1.15rem !important;
  font-weight: 700 !important;
  color: var(--text-primary) !important;
}}
.viewer-badge {{
  background: rgba(27, 217, 106, 0.15) !important;
  color: var(--accent-light) !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  border-radius: var(--radius-xs) !important;
  padding: 3px 8px !important;
}}
.viewer-meta-panel {{
  width: 320px !important;
  min-width: 280px !important;
  max-width: 340px !important;
  height: 100% !important;
  padding: 20px !important;
  border-right: 1px solid var(--border) !important;
  background: var(--bg-base) !important;
  overflow-y: auto !important;
  flex-shrink: 0 !important;
}}
.meta-label {{
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}}
.meta-value {{
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}}
.meta-value-sm {{
  font-size: 0.75rem;
  color: var(--text-secondary);
  word-break: break-all;
}}

/* ─── Diálogo Genérico ─── */
.dialog-card {{
  background: var(--bg-surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-lg) !important;
  padding: 24px !important;
  min-width: 360px;
  max-width: 460px;
}}
.import-dialog-card {{
  background: var(--bg-surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius-lg) !important;
  padding: 20px !important;
  min-width: 440px;
  max-width: 520px;
}}
.dialog-title {{
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-primary);
}}

/* ─── Minecraft / Modrinth Card Box ─── */
.mc-card {{
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
  padding: 20px !important;
}}
.mc-stat-card {{
  background: var(--bg-surface) !important;
  border: 1px solid var(--border) !important;
  border-radius: var(--radius) !important;
  padding: 16px !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
}}

/* ─── FAB Descarga ─── */
.fab-download {{
  position: fixed !important;
  bottom: 24px !important;
  right: 24px !important;
  z-index: 99 !important;
  background: var(--accent) !important;
  color: #0b2915 !important;
  font-weight: 800 !important;
  border-radius: 30px !important;
  padding: 10px 22px !important;
  box-shadow: 0 8px 24px rgba(27, 217, 106, 0.4) !important;
}}

/* ─── Inputs de NiceGUI / Quasar estilizados ─── */
.q-field--standard .q-field__control:before {{
  border-bottom: 1px solid var(--border) !important;
}}
.q-field__native, .q-field__input {{
  color: var(--text-primary) !important;
}}
"""


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


# Páginas ──────────────────────────────────────────────────────────────────

def _inject_css() -> None:
    """Inyecta el CSS global y el motor 3D Three.js en la página actual."""
    ui.add_head_html(f"<style>\n{GLOBAL_CSS}\n</style>")
    ui.add_head_html('<script type="module" src="/viewer3d/litevault-viewer.js"></script>')


@ui.page("/")
def page_home():
    _inject_css()
    from app.ui.pages.home import HomePage
    HomePage()


@ui.page("/categories")
def page_categories():
    _inject_css()
    from app.ui.pages.home import build_navbar
    from app.ui.pages.categories import CategoriesPage
    build_navbar(active_tab="categories")
    CategoriesPage()


@ui.page("/tags")
def page_tags():
    _inject_css()
    from app.ui.pages.home import build_navbar
    from app.ui.pages.tags import TagsPage
    build_navbar(active_tab="tags")
    TagsPage()


@ui.page("/settings")
def page_settings():
    _inject_css()
    from app.ui.pages.home import build_navbar
    from app.ui.pages.settings import SettingsPage
    build_navbar(active_tab="settings")
    SettingsPage()


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

    # Servir storage/ para schematics, thumbnails y recursos
    app.add_static_files("/storage", str(STORAGE_DIR))
    # Servir visor 3D Deepslate de albertchen857/Litematica-viewer
    app.add_static_files("/viewer3d", str(Path(__file__).parent / "static" / "viewer3d"))

    ui.run(
        title=APP_TITLE,
        port=8080,
        native=True,
        window_size=(WINDOW_WIDTH, WINDOW_HEIGHT),
        dark=True,
        reload=False,
        show=False,               # No abrir navegador del sistema — ventana nativa
        show_welcome_message=False,
        favicon="💎",
    )


if __name__ == "__main__":
    run()
