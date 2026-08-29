from nicegui import ui
import sys
import os
import asyncio
from typing import Optional

from app.services.update_service import download_and_install_update
from app.i18n import _t

def open_update_dialog(version: str, notes: str, download_url: str, is_manual: bool = False):
    """Muestra el diálogo de actualización."""
    with ui.dialog().classes("backdrop-blur-sm") as dialog:
        with ui.card().classes("w-[500px] p-6 glass-panel"):
            ui.label(_t("update.new_version", version=version)).classes("text-2xl font-bold text-[var(--accent)] mb-2")
            
            ui.label(_t("update.whats_new")).classes("text-sm font-bold text-[var(--text-secondary)] mt-2")
            
            # Scroll area para las notas
            with ui.scroll_area().classes("w-full h-40 border border-[#333] rounded p-2 bg-[#1a1a1a] my-2"):
                ui.markdown(notes).classes("text-sm text-gray-300")
            
            progress_bar = ui.linear_progress(value=0, show_value=False).classes("w-full mt-4").style("display: none;")
            progress_label = ui.label(_t("update.downloading")).classes("text-xs text-gray-400 mt-1").style("display: none;")
            
            async def _on_download():
                download_btn.disable()
                cancel_btn.disable()
                progress_bar.style("display: block;")
                progress_label.style("display: block;")
                
                def _update_progress(val: float):
                    progress_bar.value = val
                    progress_label.text = _t("update.downloading_pct", pct=int(val * 100))
                    
                try:
                    await download_and_install_update(download_url, _update_progress)
                    progress_label.text = _t("update.download_complete")
                    progress_label.classes("text-[var(--accent)]")
                    await asyncio.sleep(1.5)
                    # Forzar el cierre de la aplicación actual para que el instalador pueda machacar los archivos
                    from nicegui import app
                    app.shutdown()
                    os._exit(0)
                except Exception as e:
                    ui.notify(_t("update.download_error", error=e), color="negative")
                    dialog.close()

            with ui.row().classes("w-full justify-end gap-3 mt-4"):
                cancel_btn = ui.button(_t("update.later_btn"), on_click=dialog.close).classes("btn-secondary")
                download_btn = ui.button(_t("update.download_btn"), on_click=_on_download, icon="system_update_alt").classes("btn-primary text-white")

    dialog.open()

def open_no_update_dialog():
    """Diálogo cuando ya estás en la última versión."""
    with ui.dialog() as dialog:
        with ui.card().classes("w-[350px] p-6 glass-panel text-center items-center"):
            ui.icon("check_circle", size="4rem").classes("text-green-500 mb-4")
            ui.label(_t("update.up_to_date_title")).classes("text-xl font-bold text-white")
            ui.label(_t("update.up_to_date_desc")).classes("text-sm text-gray-400 mt-2 text-center")
            ui.button(_t("update.great_btn"), on_click=dialog.close).classes("btn-primary mt-6 w-full text-white")
    dialog.open()
