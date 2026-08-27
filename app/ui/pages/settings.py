"""
settings.py — Página de Configuración, Almacenamiento y Créditos de LiteVault.

Diseño inspirado en la aplicación Modrinth con estética Minecraft:
  - Resumen de almacenamiento y carpetas del sistema
  - Estadísticas de la colección (schematics, categorías, tags, espacio)
  - Créditos detallados: Autor, tecnologías, librerías y repositorios oficiales.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path
from nicegui import ui
from sqlmodel import select, func, delete

from app.config import (
    APP_TITLE,
    BASE_DIR,
    DB_PATH,
    SCHEMATICS_DIR,
    STORAGE_DIR,
    THUMBNAILS_DIR,
)
from app.db.database import get_session
from app.db.models import Category, Schematic, Tag


def _open_folder_native(path: Path | str) -> None:
    """Abre una carpeta en el explorador de archivos nativo de Windows."""
    try:
        p = Path(path).resolve()
        if not p.exists():
            p.mkdir(parents=True, exist_ok=True)
        if sys.platform == "win32":
            os.startfile(str(p))  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            subprocess.Popen(["open", str(p)])
        else:
            subprocess.Popen(["xdg-open", str(p)])
    except Exception as exc:
        ui.notify(f"Error al abrir la carpeta: {exc}", color="warning")


def _format_bytes(size_bytes: int) -> str:
    """Formatea bytes a KB, MB o GB legibles."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def _get_dir_size(path: Path) -> int:
    """Calcula el tamaño total de los archivos en un directorio."""
    total = 0
    if path.exists():
        for f in path.rglob("*"):
            if f.is_file():
                try:
                    total += f.stat().st_size
                except Exception:
                    pass
    return total


class SettingsPage:
    """Página de Configuración y Acerca de LiteVault."""

    def __init__(self) -> None:
        self._build_ui()

    def _build_ui(self) -> None:
        from app.ui.components.sidebar import Sidebar
        from app.i18n import _t
        
        with ui.element("div").classes("app-layout"):
            Sidebar(
                on_filter_change=lambda c, t: ui.navigate.to("/"),
                active_tab="settings"
            )
            
            with ui.column().classes("main-content-scroll w-full gap-6 p-6"):

                # Header de página ──────────────────────────────────────────────
                with ui.row().classes("items-center justify-between w-full"):
                    with ui.row().classes("items-center gap-3"):
                        ui.icon("settings", size="1.8rem").style("color: var(--accent)")
                        with ui.column().classes("gap-0"):
                            ui.label("Configuración & Sistema").classes("page-title")
                            ui.label("Gestión de almacenamiento, rutas y créditos del proyecto").style(
                                "color: var(--text-secondary); font-size: 0.85rem;"
                            )
                    ui.button(
                        "Volver a la Colección",
                        icon="arrow_back",
                        on_click=lambda: ui.navigate.to("/"),
                    ).classes("btn-secondary")
    
                # Estadísticas rápidas (Modrinth Stat Cards) ────────────────────
                with get_session() as session:
                    schem_count = session.exec(select(func.count(Schematic.id))).one() or 0
                    cat_count = session.exec(select(func.count(Category.id))).one() or 0
                    tag_count = session.exec(select(func.count(Tag.id))).one() or 0
    
                storage_size = _get_dir_size(STORAGE_DIR)
                schem_size = _get_dir_size(SCHEMATICS_DIR)
                thumb_size = _get_dir_size(THUMBNAILS_DIR)
    
                with ui.row().classes("w-full grid grid-cols-1 md:grid-cols-4 gap-4"):
                    self._render_stat_card("inventory_2", "Litemáticas", str(schem_count), "var(--accent)", f"{_format_bytes(schem_size)}")
                    self._render_stat_card("folder", "Categorías", str(cat_count), "var(--accent-purple)", "Estructura")
                    self._render_stat_card("label", "Tags", str(tag_count), "var(--accent-cyan)", "Etiquetas")
                    self._render_stat_card("hard_drive", "Almacenamiento", _format_bytes(storage_size), "var(--accent-gold)", f"Miniaturas: {_format_bytes(thumb_size)}")
    
                # Tarjeta: Sincronización con Discord ───────────────────────────
                self._render_discord_card()
    
                # Tarjeta: Almacenamiento & Rutas ───────────────────────────────
                with ui.card().classes("mc-card w-full"):
                    with ui.row().classes("items-center gap-2 mb-4"):
                        ui.icon("folder_special", size="1.3rem").style("color: var(--accent)")
                        ui.label("Ubicaciones de Almacenamiento").style("font-size:1.05rem; font-weight:700; color:var(--text-primary);")
    
                    # Ruta 1: Schematics
                    with ui.row().classes("items-center justify-between w-full py-3 border-b border-[var(--border)]"):
                        with ui.column().classes("gap-1 flex-1 pr-4"):
                            ui.label("Carpeta de Schematics (.litematic)").classes("meta-label")
                            ui.label(str(SCHEMATICS_DIR.resolve())).classes("font-mono text-xs text-[var(--text-secondary)] break-all")
                        ui.button(
                            "Abrir en Explorador",
                            icon="folder_open",
                            on_click=lambda: _open_folder_native(SCHEMATICS_DIR),
                        ).classes("btn-secondary")
    
                    # Ruta 2: Miniaturas
                    with ui.row().classes("items-center justify-between w-full py-3 border-b border-[var(--border)]"):
                        with ui.column().classes("gap-1 flex-1 pr-4"):
                            ui.label("Caché de Miniaturas 3D").classes("meta-label")
                            ui.label(str(THUMBNAILS_DIR.resolve())).classes("font-mono text-xs text-[var(--text-secondary)] break-all")
                        ui.button(
                            "Abrir en Explorador",
                            icon="image",
                            on_click=lambda: _open_folder_native(THUMBNAILS_DIR),
                        ).classes("btn-secondary")
    
                    # Ruta 3: Base de Datos SQLite
                    with ui.row().classes("items-center justify-between w-full py-3"):
                        with ui.column().classes("gap-1 flex-1 pr-4"):
                            ui.label("Base de Datos SQLite").classes("meta-label")
                            ui.label(str(DB_PATH.resolve())).classes("font-mono text-xs text-[var(--text-secondary)] break-all")
                        ui.button(
                            "Abrir Carpeta",
                            icon="storage",
                            on_click=lambda: _open_folder_native(STORAGE_DIR),
                        ).classes("btn-secondary")
    
                # Tarjeta: Zona de Peligro ─────────────────────────────────────────
                with ui.card().classes("mc-card w-full").style("border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.02);"):
                    with ui.row().classes("items-center gap-2 mb-4"):
                        ui.icon("warning", size="1.3rem").style("color: var(--danger)")
                        ui.label("Zona de Peligro").style("font-size:1.05rem; font-weight:700; color:var(--danger);")
    
                    with ui.row().classes("items-center justify-between w-full"):
                        with ui.column().classes("gap-1 flex-1 pr-4"):
                            ui.label("Eliminar todas las litemáticas y miniaturas").classes("meta-label").style("color: var(--text-primary);")
                            ui.label("Esta acción borrará permanentemente de tu disco duro todos los archivos de litemáticas y miniaturas gestionadas por LiteVault, vaciando completamente tu colección.").classes("text-xs text-[var(--text-secondary)]")
                        ui.button(
                            "Eliminar Todo",
                            icon="delete_forever",
                            on_click=self._on_delete_all_click,
                        ).classes("btn-primary").style("background: var(--danger) !important; color: white !important;")
    
                # Tarjeta: Acerca de, Creador & Reconocimientos ──────────────────
                with ui.card().classes("mc-card w-full"):
                    with ui.row().classes("items-center gap-2 mb-4"):
                        ui.icon("verified", size="1.3rem").style("color: var(--accent)")
                        ui.label("Acerca de LiteVault & Créditos").style("font-size:1.05rem; font-weight:700; color:var(--text-primary);")
    
                    # Información de Autoría
                    with ui.element("div").classes("w-full p-4 rounded-xl mb-4").style("background: rgba(27,217,106,0.06); border: 1px solid rgba(27,217,106,0.2);"):
                        with ui.row().classes("items-center gap-3"):
                            ui.icon("diamond", size="1.8rem").style("color: var(--accent)")
                            with ui.column().classes("gap-0.5"):
                                ui.label("LiteVault — Gestor Personal de Schematics").style("font-weight:700; font-size:1rem; color:var(--accent-light);")
                                ui.label("Diseñado y desarrollado para organizar, previsualizar y catalogar construcciones de Minecraft.").style("color:var(--text-secondary); font-size:0.85rem;")
    
                    # Tecnologías usadas
                    ui.label("TECNOLOGÍAS PRINCIPALES").classes("meta-label mb-2")
                    with ui.row().classes("flex-wrap gap-2 mb-6"):
                        self._render_tech_badge("Python 3.14", "#3776ab", "Lenguaje Core")
                        self._render_tech_badge("NiceGUI & PyWebView", "#1bd96a", "UI Nativa")
                        self._render_tech_badge("Nucleation (Rust)", "#dea584", "Motor Schematics")
                        self._render_tech_badge("SQLModel & SQLite", "#003b57", "Persistencia")
                        self._render_tech_badge("Minecraft Resource Pack", "#22c55e", "Texturas Oficiales")
                        self._render_tech_badge("Pillow", "#8b5cf6", "Procesamiento Imagen")
    
                    # Repositorios y Agradecimientos
                    ui.label("REPOSITORIOS Y AGRADECIMIENTOS").classes("meta-label mb-2")
                    with ui.column().classes("gap-3 w-full"):
                        self._render_repo_item(
                            "Nucleation",
                            "Schem-at / Nucleation",
                            "Motor ultra-rápido en Rust compilado a bindings de Python para parseo y renderizado de litemáticas.",
                            "https://github.com/Schem-at/Nucleation",
                        )
                        self._render_repo_item(
                            "Litematica",
                            "masa / sakurashis",
                            "El mod original de Minecraft para creación y guardado de esquemas .litematic.",
                            "https://github.com/maruohon/litematica",
                        )
                        self._render_repo_item(
                            "Modrinth Design & Assets",
                            "Modrinth / Rinth, Inc.",
                            "Inspiración visual de interfaz limpia, paleta de colores y experiencia de usuario para Minecraft.",
                            "https://modrinth.com",
                        )
                        self._render_repo_item(
                            "Minecraft Default Assets",
                            "Mojang Studios / Microsoft",
                            "Modelos y texturas oficiales de bloques utilizados para la generación de renders.",
                            "https://minecraft.net",
                        )
    
    def _render_stat_card(self, icon_name: str, title: str, value: str, color: str, subtitle: str) -> None:
        with ui.card().classes("mc-stat-card"):
            with ui.row().classes("items-center justify-between w-full"):
                ui.label(title).style("color: var(--text-secondary); font-size: 0.8rem; font-weight:600;")
                ui.icon(icon_name, size="1.2rem").style(f"color: {color};")
            ui.label(value).style(f"color: var(--text-primary); font-size: 1.6rem; font-weight: 800; font-family: 'Outfit', sans-serif;")
            ui.label(subtitle).style("color: var(--text-muted); font-size: 0.75rem;")

    def _render_tech_badge(self, name: str, color: str, tag: str) -> None:
        with ui.row().classes("items-center gap-1.5 px-3 py-1.5 rounded-lg").style(f"background: var(--bg-surface); border: 1px solid var(--border);"):
            ui.element("div").style(f"width:8px; height:8px; border-radius:50%; background:{color};")
            ui.label(name).style("font-size:0.8rem; font-weight:600; color:var(--text-primary);")
            ui.label(f"({tag})").style("font-size:0.75rem; color:var(--text-muted);")

    def _render_repo_item(self, name: str, author: str, description: str, url: str) -> None:
        with ui.row().classes("items-center justify-between w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)] transition-all"):
            with ui.column().classes("gap-0.5 flex-1 pr-4"):
                with ui.row().classes("items-center gap-2"):
                    ui.label(name).style("font-weight:700; color:var(--text-primary); font-size:0.9rem;")
                    ui.label(f"por {author}").style("font-size:0.75rem; color:var(--accent-light);")
                ui.label(description).style("color:var(--text-secondary); font-size:0.8rem;")
            with ui.row().classes("items-center gap-1 text-[var(--accent)] text-xs font-semibold"):
                ui.link("GitHub ↗", url, new_tab=True).classes("text-[var(--accent)] hover:underline")

    def _on_delete_all_click(self) -> None:
        """Muestra el modal de confirmación para eliminar todo."""
        with ui.dialog() as dialog, ui.card().classes("p-6 w-[450px]").style("background: var(--bg-surface); border: 1px solid var(--border);"):
            with ui.row().classes("items-center gap-2 mb-2"):
                ui.icon("warning", size="1.5rem").style("color: var(--danger)")
                ui.label("Confirmar Eliminación Masiva").style("font-size: 1.1rem; font-weight: 700; color: var(--danger);")
            
            ui.label("¿Estás seguro de que deseas eliminar TODAS las litemáticas y miniaturas?").style("color: var(--text-primary); font-weight: 600; margin-bottom: 8px;")
            ui.label("Esta acción es irreversible. Se borrarán todos los archivos físicos en disco (.litematic y .png) de la colección y se limpiará la base de datos.").style("color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 16px;")
            
            with ui.row().classes("w-full justify-end gap-3 mt-4"):
                ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                ui.button("Sí, Eliminar Todo", on_click=lambda: self._execute_delete_all(dialog)).classes("btn-primary").style("background: var(--danger) !important; color: white !important;")
        dialog.open()

    def _execute_delete_all(self, dialog) -> None:
        """Ejecuta el borrado de archivos físicos y registros."""
        from app.db.models import Category, Tag, SchematicTagLink
        try:
            # Borrar archivos de disco
            for f in SCHEMATICS_DIR.glob("*.litematic"):
                f.unlink(missing_ok=True)
            for f in THUMBNAILS_DIR.glob("*.png"):
                f.unlink(missing_ok=True)
            
            # Limpiar TODO en la BD para empezar de cero
            with get_session() as session:
                session.exec(delete(SchematicTagLink))
                session.exec(delete(Schematic))
                session.exec(delete(Tag))
                session.exec(delete(Category))
                session.commit()
                
            ui.notify("Se ha eliminado correctamente TODA la colección (litemáticas, categorías y tags).", color="positive", icon="check_circle")
            dialog.close()
            # Recargar la página para actualizar las estadísticas
            ui.navigate.to("/settings")
        except Exception as exc:
            ui.notify(f"Error al eliminar archivos: {exc}", color="negative", icon="error")
            dialog.close()

    def _render_discord_card(self) -> None:
        """Renderiza la tarjeta de configuración de Token y sincronización de Discord."""
        from app.services.discord_sync_service import load_discord_config, save_discord_config, sync_discord_async

        cfg = load_discord_config()
        current_token = cfg.get("token") or ""
        current_invite = cfg.get("invite_or_guild") or ""

        with ui.card().classes("mc-card w-full"):
            with ui.row().classes("items-center justify-between w-full mb-3"):
                with ui.row().classes("items-center gap-2"):
                    ui.icon("cloud_sync", size="1.4rem").style("color: var(--accent)")
                    ui.label("Sincronización Universal de Discord").style("font-size:1.05rem; font-weight:700; color:var(--text-primary);")
                ui.badge("Auto-Detección").style("background: rgba(27,217,106,0.15); color: var(--accent);")

            ui.label(
                "Configura tu token personal y cualquier enlace de invitación de Discord (o ID de servidor). LiteVault resolverá automáticamente el servidor, creará las categorías y descargará todas las litemáticas con sus miniaturas 3D."
            ).style("color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;")

            token_input = ui.input(
                label="Token Personal de Discord (Authorization)",
                value=current_token,
                password=True,
                password_toggle_button=True,
                placeholder="Pega tu token aquí…",
            ).classes("w-full mb-3")

            invite_input = ui.input(
                label="Enlace de Invitación o ID del Servidor",
                value=current_invite,
                placeholder="Ej: https://discord.gg/nkGFgD2YW o 1161803566265143306",
            ).classes("w-full mb-4")

            def _save_cfg():
                t = token_input.value.strip()
                inv = invite_input.value.strip()
                if not t:
                    ui.notify("El token no puede estar vacío", color="negative")
                    return
                save_discord_config(t, inv)
                ui.notify("Configuración de Discord guardada", color="positive", position="bottom-right")

            def _open_sync_modal():
                _save_cfg()
                from app.ui.pages.home import open_discord_sync_dialog
                open_discord_sync_dialog()

            with ui.row().classes("items-center justify-end gap-3 w-full"):
                ui.button("Guardar Configuración", icon="save", on_click=_save_cfg).classes("btn-secondary")
                ui.button("Sincronizar Servidor", icon="sync", on_click=_open_sync_modal).classes("btn-primary")