from nicegui import ui
import sys
import os
from typing import Optional

from app.services.update_service import download_and_install_update

def open_update_dialog(version: str, notes: str, download_url: str, is_manual: bool = False):
    """Muestra el diálogo de actualización."""
    with ui.dialog().classes("backdrop-blur-sm") as dialog:
        with ui.card().classes("w-[500px] p-6 glass-panel"):
            ui.label(f"¡Nueva versión disponible! (v{version})").classes("text-2xl font-bold text-[var(--accent)] mb-2")
            
            ui.label("Novedades:").classes("text-sm font-bold text-[var(--text-secondary)] mt-2")
            
            # Scroll area para las notas
            with ui.scroll_area().classes("w-full h-40 border border-[#333] rounded p-2 bg-[#1a1a1a] my-2"):
                ui.markdown(notes).classes("text-sm text-gray-300")
            
            progress_bar = ui.linear_progress(value=0, show_value=False).classes("w-full mt-4").style("display: none;")
            progress_label = ui.label("Descargando...").classes("text-xs text-gray-400 mt-1").style("display: none;")
            
            async def _on_download():
                download_btn.disable()
                cancel_btn.disable()
                progress_bar.style("display: block;")
                progress_label.style("display: block;")
                
                def _update_progress(val: float):
                    progress_bar.value = val
                    progress_label.text = f"Descargando... {int(val * 100)}%"
                    
                try:
                    await download_and_install_update(download_url, _update_progress)
                    progress_label.text = "¡Descarga completa! Iniciando instalador..."
                    progress_label.classes("text-[var(--accent)]")
                    await ui.sleep(1.5)
                    # Forzar el cierre de la aplicación actual para que el instalador pueda machacar los archivos
                    from nicegui import app
                    app.shutdown()
                    os._exit(0)
                except Exception as e:
                    ui.notify(f"Error descargando la actualización: {e}", color="negative")
                    dialog.close()

            with ui.row().classes("w-full justify-end gap-3 mt-4"):
                cancel_btn = ui.button("Más tarde", on_click=dialog.close).classes("btn-secondary")
                download_btn = ui.button("Descargar e Instalar", on_click=_on_download, icon="system_update_alt").classes("btn-primary text-white")

    dialog.open()

def open_no_update_dialog():
    """Diálogo cuando ya estás en la última versión."""
    with ui.dialog() as dialog:
        with ui.card().classes("w-[350px] p-6 glass-panel text-center items-center"):
            ui.icon("check_circle", size="4rem").classes("text-green-500 mb-4")
            ui.label("¡Estás al día!").classes("text-xl font-bold text-white")
            ui.label("Tienes instalada la última versión de LiteVault.").classes("text-sm text-gray-400 mt-2 text-center")
            ui.button("Genial", on_click=dialog.close).classes("btn-primary mt-6 w-full text-white")
    dialog.open()
