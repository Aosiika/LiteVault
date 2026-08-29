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
                        ui.label(_t("settings.version")).classes("text-[var(--text-secondary)]")
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

                            chk_btn = ui.button(_t("settings.check_updates"), icon="sync", on_click=_manual_check).props("flat dense").classes("text-[var(--accent)] text-xs ml-2")
                        
                    with ui.row().classes("justify-between w-full items-center py-2 border-b border-[var(--border)]"):
                        ui.label(_t("settings.project_status")).classes("text-[var(--text-secondary)]")
                        ui.label(_t("settings.project_status_desc")).classes("text-sm italic text-gray-400")
                        
                    with ui.column().classes("w-full py-4 border-b border-[var(--border)] gap-3"):
                        ui.label(_t("settings.tech_stack")).classes("text-[var(--text-secondary)] mb-1")
                        
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
                        ui.label(_t("settings.disclaimer_title")).classes("text-[var(--text-secondary)] mb-1")
                        ui.label(_t("settings.disclaimer_text")).classes("text-xs text-gray-500")

                    with ui.row().classes("w-full pt-4 justify-between items-center"):
                        ui.button(_t("settings.github_btn"), icon="code", on_click=lambda: ui.run_javascript("window.open('https://github.com/Aosiika/LiteVault', '_blank')")).classes("btn-secondary text-white")

                with ui.card().classes("w-full p-6 glass-panel mt-4"):
                    ui.label(_t("settings.discord_sync")).classes("text-xl font-bold mb-4 text-[var(--accent)]")
                    ui.label(_t("settings.discord_sync_desc")).classes("text-[var(--text-secondary)] text-sm")

                with ui.card().classes("w-full p-6 glass-panel mt-4"):
                    ui.label(_t("settings.danger_zone")).classes("text-xl font-bold mb-4 text-[var(--danger)]")
                    ui.label(_t("settings.danger_zone_desc")).classes("text-[var(--text-secondary)] text-sm mb-4")
                    
                    def _open_reset_modal():
                        with ui.dialog().classes("backdrop-blur-sm") as dialog:
                            with ui.card().classes("w-[500px] p-6 glass-panel border border-red-500/30"):
                                with ui.row().classes("items-center gap-2 mb-4"):
                                    ui.icon("warning", size="2rem").classes("text-[var(--danger)]")
                                    ui.label(_t("settings.reset_modal_title")).classes("text-2xl font-bold text-[var(--danger)]")
                                
                                ui.label(_t("settings.reset_modal_desc1")).classes("text-white font-bold mb-2")
                                ui.label(_t("settings.reset_modal_bullet1")).classes("text-sm text-gray-300 ml-4")
                                ui.label(_t("settings.reset_modal_bullet2")).classes("text-sm text-gray-300 ml-4")
                                ui.label(_t("settings.reset_modal_bullet3")).classes("text-sm text-gray-300 ml-4")
                                ui.label(_t("settings.reset_modal_bullet4")).classes("text-sm text-gray-300 ml-4")
                                
                                ui.label(_t("settings.reset_modal_desc2")).classes("text-sm text-gray-400 mt-4 italic")
                                
                                def _do_factory_reset():
                                    from app.db.database import reset_database
                                    import time
                                    
                                    try:
                                        reset_database()
                                        ui.notify(_t("settings.reset_success"), color="positive")
                                        # Forzar recarga de UI y redirigir a inicio (al forzar recarga en el front, conectará con la DB nueva)
                                        ui.run_javascript("setTimeout(() => { window.location.href = '/'; }, 1500);")
                                        dialog.close()
                                    except Exception as e:
                                        ui.notify(_t("settings.reset_error", error=e), color="negative")
                                
                                with ui.row().classes("w-full justify-end gap-3 mt-6"):
                                    ui.button(_t("settings.reset_cancel"), on_click=dialog.close).classes("btn-secondary")
                                    ui.button(_t("settings.reset_confirm_btn"), icon="delete_forever", on_click=_do_factory_reset).classes("btn-primary text-white").style("background: var(--danger) !important;")

                        dialog.open()

                    ui.button(_t("settings.delete_all_db"), icon="delete_forever", on_click=_open_reset_modal).classes("btn-primary").style("background: var(--danger) !important; color: white !important;")
