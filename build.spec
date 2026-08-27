# -*- mode: python ; coding: utf-8 -*-
"""
build.spec — Configuración de PyInstaller para LiteVault.

Genera un único ejecutable con:
  - La app Python completa
  - El build estático del viewer (app/static/viewer/)
  - Los iconos (app/static/icons/)

Uso:
    pyinstaller build.spec
"""

import sys
from pathlib import Path

block_cipher = None

BASE = Path(SPECPATH)  # noqa: F821 — SPECPATH es variable interna de PyInstaller

a = Analysis(
    [str(BASE / "app" / "main.py")],
    pathex=[str(BASE)],
    binaries=[],
    datas=[
        # Visor 3D Three.js
        (str(BASE / "app" / "static" / "viewer3d"), "app/static/viewer3d"),
        # Texturas oficiales
        (str(BASE / "app" / "static" / "textures"), "app/static/textures"),
        # Iconos de la app
        (str(BASE / "app" / "static" / "icons"),   "app/static/icons"),
        # Assets
        (str(BASE / "app" / "assets"),              "app/assets"),
    ],
    hiddenimports=[
        "nicegui",
        "nicegui.native",
        "webview",
        "sqlmodel",
        "sqlalchemy",
        "pydantic",
        "nucleation",
        "PIL",
        "PIL.Image",
        "PIL.ImageDraw",
        "PIL.ImageFont",
        "aiofiles",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "scipy", "numpy", "test"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)  # noqa: F821

exe = EXE(  # noqa: F821
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="LiteVault",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,     # sin ventana de consola
    windowed=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # icon=str(BASE / "app" / "assets" / "icon.ico"),  # descomenta si tienes icono .ico
)
