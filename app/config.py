"""
config.py — Rutas base y constantes de la aplicación.
Todo path se resuelve de forma absoluta respecto a la ubicación de este archivo,
de modo que funciona tanto en desarrollo como empaquetado con PyInstaller.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuración Principal
# ---------------------------------------------------------------------------
APP_VERSION = "1.0.0"
GITHUB_REPO = "Aosiika/LiteVault"

# ---------------------------------------------------------------------------
# Rutas base
# ---------------------------------------------------------------------------

# En desarrollo: .../litevault/app/config.py  → BASE = .../litevault
# En PyInstaller --onefile: sys._MEIPASS es el directorio temporal de extracción
if getattr(sys, "frozen", False):
    # Ejecutable PyInstaller
    APP_DIR: Path = Path(sys._MEIPASS) / "app"          # type: ignore[attr-defined]
    BASE_DIR: Path = Path(sys.executable).parent
    # Usar %APPDATA%/LiteVault para no requerir permisos de Administrador
    appdata = os.environ.get("APPDATA")
    if appdata:
        STORAGE_DIR: Path = Path(appdata) / "LiteVault" / "storage"
    else:
        STORAGE_DIR: Path = Path.home() / ".litevault" / "storage"
else:
    APP_DIR = Path(__file__).parent.resolve()
    BASE_DIR = APP_DIR.parent
    STORAGE_DIR = BASE_DIR.parent / "storage"

SCHEMATICS_DIR: Path = STORAGE_DIR / "schematics"
THUMBNAILS_DIR: Path = STORAGE_DIR / "thumbnails"
DB_PATH: Path = STORAGE_DIR / "litevault.db"

STATIC_DIR: Path = APP_DIR / "static"
VIEWER_DIR: Path = STATIC_DIR / "viewer"
ICONS_DIR: Path = STATIC_DIR / "icons"

# ---------------------------------------------------------------------------
# Asegurar que existan los directorios de datos
# ---------------------------------------------------------------------------

for _d in (SCHEMATICS_DIR, THUMBNAILS_DIR, STORAGE_DIR):
    _d.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Constantes de la UI
# ---------------------------------------------------------------------------

APP_TITLE = "LiteVault"
WINDOW_WIDTH = 1400
WINDOW_HEIGHT = 900

COLORS = {
    "bg_base": "#111216",          # Bedrock profundo
    "bg_surface": "#17181d",       # Obsidian surface
    "bg_card": "#1f2026",          # Netherite card
    "bg_card_hover": "#272932",    # Hover state
    "accent": "#1bd96a",           # Modrinth / Esmeralda Minecraft
    "accent_hover": "#17c05d",
    "accent_light": "#44ea8b",
    "accent_glow": "rgba(27, 217, 106, 0.28)",
    "accent_purple": "#a855f7",    # Amatista
    "accent_cyan": "#00d2ff",      # Diamante
    "accent_gold": "#f59e0b",      # Oro / Redstone
    "text_primary": "#f3f4f8",
    "text_secondary": "#9ca3af",
    "text_muted": "#5a6072",
    "border": "#282b34",
    "border_hover": "#3a3e4c",
    "success": "#1bd96a",
    "warning": "#f59e0b",
    "danger": "#ef4444",
}

THUMBNAIL_W = 280
THUMBNAIL_H = 200


def thumb_to_url(abs_path: str | Path | None) -> str | None:
    """
    Convierte una ruta absoluta de thumbnail a URL relativa
    que NiceGUI sirve via app.add_static_files('/storage', STORAGE_DIR).

    Ej: C:\\...\\storage\\thumbnails\\abc.png  →  /storage/thumbnails/abc.png
    """
    if not abs_path:
        return None
    p = Path(abs_path)
    if not p.exists():
        return None
    try:
        rel = p.relative_to(STORAGE_DIR)
        return "/storage/" + rel.as_posix()
    except ValueError:
        return None
