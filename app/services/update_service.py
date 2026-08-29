import asyncio
import os
import sys
import tempfile
import urllib.request
import urllib.error
import json
import logging
from typing import Optional, Tuple, Callable
import subprocess
from pathlib import Path

from app.config import APP_VERSION, GITHUB_REPO

logger = logging.getLogger(__name__)

async def check_for_updates() -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
    """
    Checks GitHub for a newer release.
    Returns: (has_update, new_version, release_notes, download_url)
    """
    api_url = f"https://api.github.com/repos/{GITHUB_REPO}/releases/latest"
    
    def _do_request():
        req = urllib.request.Request(api_url, headers={"User-Agent": "LiteVault-Updater"})
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                return json.loads(response.read().decode())
        except Exception as e:
            logger.warning(f"Failed to check for updates: {e}")
            return None

    data = await asyncio.to_thread(_do_request)
    if not data:
        return False, None, None, None

    latest_version = data.get("tag_name", "").lstrip("v")
    if not latest_version:
        return False, None, None, None

    # Very basic version comparison (assumes format X.Y.Z)
    try:
        def parse_version(v: str):
            return tuple(map(int, v.split(".")))
        
        if parse_version(latest_version) > parse_version(APP_VERSION):
            # Find the .exe asset
            download_url = None
            for asset in data.get("assets", []):
                if asset.get("name", "").endswith(".exe"):
                    download_url = asset.get("browser_download_url")
                    break
            
            return True, latest_version, data.get("body", "No hay notas de la versión disponibles."), download_url
    except Exception as e:
        logger.error(f"Error comparing versions: {e}")
    
    return False, None, None, None


async def download_and_install_update(download_url: str, progress_callback: Callable[[float], None]) -> None:
    """
    Downloads the installer to a temporary file and runs it.
    """
    tmp_dir = Path(tempfile.gettempdir())
    installer_path = tmp_dir / "LiteVault_Update_Setup.exe"

    def _download():
        req = urllib.request.Request(download_url, headers={"User-Agent": "LiteVault-Updater"})
        with urllib.request.urlopen(req) as response:
            total_size = int(response.headers.get("Content-Length", 0))
            downloaded = 0
            with open(installer_path, "wb") as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress_callback(downloaded / total_size)

    await asyncio.to_thread(_download)
    # En Windows, para evitar el 'Security validation failure' de PyInstaller,
    # debemos limpiar las variables de entorno a nivel de OS. Un script .bat es lo más seguro.
    if sys.platform == "win32":
        bat_path = installer_path.with_suffix('.bat')
        bat_content = f"""@echo off
set _MEIPASS2=
set _MEIPASS=
set _PYINSTALLER_INIT=
timeout /t 2 /nobreak > nul
start /wait "" "{installer_path}" /SILENT
start "" "{sys.executable}"
"""
        with open(bat_path, "w") as f:
            f.write(bat_content)
        
        DETACHED_PROCESS = 0x00000008
        subprocess.Popen(["cmd.exe", "/c", str(bat_path)], creationflags=DETACHED_PROCESS)
    else:
        env = os.environ.copy()
        for var in ["_MEIPASS2", "_MEIPASS", "_PYINSTALLER_INIT"]:
            env.pop(var, None)
        subprocess.Popen([str(installer_path)], env=env)
