from nicegui import ui
from app.config import STORAGE_DIR, APP_TITLE, APP_VERSION
from app.i18n import _t
from app.ui.components.sidebar import Sidebar
from app.ui.pages.home import open_discord_sync_dialog

def render_settings_page():
    with ui.element("div").classes("app-layout"):
        Sidebar(
            on_filter_change=lambda c, t: ui.navigate.to("/"),
            active_tab="settings",
            on_sync_request=lambda: open_discord_sync_dialog()
        )
        
        with ui.element("div").classes("main-content w-full h-full overflow-y-auto"):
            with ui.column().classes("w-full max-w-3xl mx-auto p-6 gap-6 mt-4"):
                with ui.row().classes("items-center gap-3 mb-4"):
                    ui.label(_t("settings.title", default="Ajustes del Sistema")).classes("text-3xl font-bold")

                with ui.card().classes("w-full p-6 glass-panel"):
                    ui.label("Acerca de LiteVault").classes("text-xl font-bold mb-4 text-[var(--accent)]")
                    
                    with ui.row().classes("justify-between w-full items-center py-2 border-b border-[var(--border)]"):
                        ui.label("Creador").classes("text-[var(--text-secondary)]")
                        ui.label("Aosika").classes("font-bold text-white")
                        
                    with ui.row().classes("justify-between w-full items-center py-2 border-b border-[var(--border)]"):
                        ui.label("Año de creación").classes("text-[var(--text-secondary)]")
                        ui.label("2026").classes("font-mono text-gray-300")
                        
                    with ui.row().classes("justify-between w-full items-center py-2 border-b border-[var(--border)]"):
                        ui.label("Versión de la aplicación").classes("text-[var(--text-secondary)]")
                        with ui.row().classes("items-center gap-2"):
                            ui.label(APP_VERSION).classes("font-mono text-gray-300")
                            
                            async def _manual_check():
                                chk_btn.props("loading")
                                from app.services.update_service import check_for_updates
                                from app.ui.components.update_dialog import open_update_dialog, open_no_update_dialog
                                has_update, new_version, notes, url = await check_for_updates()
                                chk_btn.props(remove="loading")
                                if has_update and url:
                                    open_update_dialog(new_version, notes, url, is_manual=True)
                                else:
                                    open_no_update_dialog()

                            chk_btn = ui.button("Buscar Actualizaciones", icon="sync", on_click=_manual_check).props("flat dense").classes("text-[var(--accent)] text-xs ml-2")
                        
                    with ui.row().classes("justify-between w-full items-center py-2 border-b border-[var(--border)]"):
                        ui.label("Estado del proyecto").classes("text-[var(--text-secondary)]")
                        ui.label("En desarrollo activo (abiertos a mejoras)").classes("text-sm italic text-gray-400")
                        
                    with ui.column().classes("w-full py-4 border-b border-[var(--border)] gap-3"):
                        ui.label("Tecnologías y Repositorios Clave").classes("text-[var(--text-secondary)] mb-1")
                        
                        def _tech_card(name: str, desc: str, icon_name: str, url: str):
                            with ui.card().classes("bg-[#1a1a1a] border border-[#333] p-3 cursor-pointer hover:border-[var(--accent)] transition-colors shadow-none flex-1 min-w-[200px]").on("click", lambda: ui.run_javascript(f"window.open('{url}', '_blank')")):
                                with ui.row().classes("items-center gap-3 w-full"):
                                    ui.icon(icon_name, size="md").classes("text-[var(--accent)]")
                                    with ui.column().classes("gap-0"):
                                        ui.label(name).classes("font-bold text-sm text-white")
                                        ui.label(desc).classes("text-xs text-gray-500")

                        with ui.row().classes("w-full gap-3 flex-wrap"):
                            _tech_card("Litematica", "Mod original (maruohon)", "view_in_ar", "https://github.com/maruohon/litematica")
                            _tech_card("Litematica-viewer", "Visor 3D (albertchen857)", "3d_rotation", "https://github.com/albertchen857/Litematica-viewer")
                            _tech_card("Schematic Renderer", "Render web (vberlier)", "code", "https://github.com/vberlier/schematic-renderer")
                            _tech_card("NiceGUI", "Framework de Interfaz", "web", "https://nicegui.io/")
                            _tech_card("Python & SQLite", "Backend y BD Local", "dns", "https://www.python.org/")

                    with ui.column().classes("w-full py-4 border-b border-[var(--border)]"):
                        ui.label("Aviso Legal (Disclaimer)").classes("text-[var(--text-secondary)] mb-1")
                        ui.label("LiteVault es una aplicación de código libre. No estamos afiliados, asociados, autorizados, respaldados ni conectados oficialmente de ninguna manera con Mojang AB ni con Microsoft.").classes("text-xs text-gray-500")

                    with ui.row().classes("w-full pt-4 justify-between items-center"):
                        ui.button("Repositorio Oficial (GitHub)", icon="code", on_click=lambda: ui.run_javascript("window.open('https://github.com/Aosiika/LiteVault', '_blank')")).classes("btn-secondary text-white")

                with ui.card().classes("w-full p-6 glass-panel mt-4"):
                    ui.label("Discord Sync").classes("text-xl font-bold mb-4 text-[var(--accent)]")
                    ui.label("La configuración de Discord (Token y Servidor) se gestiona directamente desde el botón 'Sincronizar Discord' en la barra lateral.").classes("text-[var(--text-secondary)] text-sm")

                with ui.card().classes("w-full p-6 glass-panel mt-4"):
                    ui.label("Base de datos").classes("text-xl font-bold mb-4 text-[var(--danger)]")
                    ui.label("Zona de peligro. Estas acciones son irreversibles.").classes("text-[var(--text-secondary)] text-sm mb-4")
                    
                    def _confirm_reset():
                        ui.notify("Funcionalidad deshabilitada por seguridad.", color="warning")

                    ui.button("Restablecer Base de Datos", icon="delete_forever", on_click=_confirm_reset).classes("btn-primary").style("background: var(--danger) !important; color: white !important;")
