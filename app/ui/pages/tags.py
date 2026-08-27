"""
tags.py — CRUD de tags con colores personalizados estilo Minecraft / Modrinth.
"""

from __future__ import annotations

from nicegui import ui
from sqlmodel import select

from app.db.database import get_session
from app.db.models import Schematic, SchematicTagLink, Tag

# Paleta de colores temáticos de Minecraft
MINECRAFT_COLOR_PALETTE = [
    ("#ef4444", "Redstone"),
    ("#22c55e", "Esmeralda"),
    ("#00d2ff", "Diamante"),
    ("#f59e0b", "Oro"),
    ("#a855f7", "Amatista"),
    ("#3b82f6", "Lapislázuli"),
    ("#e11d48", "Nether"),
    ("#84cc16", "Slime"),
    ("#86efac", "XP Orb"),
    ("#14b8a6", "Prismarina"),
    ("#f97316", "Horno / Fuego"),
    ("#ec4899", "Ender Dragon"),
    ("#94a3b8", "Hierro"),
    ("#64748b", "Bedrock"),
]


class TagsPage:
    """Página CRUD para gestionar tags con colores personalizados."""

    def __init__(self):
        self._build()

    def _build(self) -> None:
        with ui.column().classes("main-content-scroll w-full gap-5 p-6"):
            # Header
            with ui.row().classes("items-center justify-between w-full pb-3 border-b border-[var(--border)]"):
                with ui.row().classes("items-center gap-3"):
                    ui.button(
                        icon="arrow_back",
                        on_click=lambda: ui.navigate.to("/"),
                    ).classes("btn-secondary")
                    ui.icon("label", size="1.6rem").style("color: var(--accent)")
                    ui.label("Gestión de Tags").classes("page-title")

                ui.button("Nuevo tag", icon="add", on_click=self._open_create_dialog).classes(
                    "btn-primary"
                )

            # Lista de tags
            self._list_container = ui.column().classes("w-full gap-2")
            self._render_list()

    # Lista ───────────────────────────────────────────────────────────────

    def _render_list(self) -> None:
        self._list_container.clear()
        with self._list_container:
            with get_session() as session:
                tags = session.exec(select(Tag).order_by(Tag.name)).all()

                if not tags:
                    with ui.column().classes("items-center justify-center p-12 w-full gap-2"):
                        ui.icon("label_off", size="3rem").style("color: var(--text-muted)")
                        ui.label("Sin tags todavía").style("color: var(--text-secondary); font-weight: 600;")
                    return

                with ui.element("div").classes("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full"):
                    for tag in tags:
                        usage_count = len(
                            session.exec(
                                select(SchematicTagLink).where(SchematicTagLink.tag_id == tag.id)
                            ).all()
                        )
                        self._render_tag_card(tag, usage_count)

    def _render_tag_card(self, tag: Tag, usage_count: int) -> None:
        color = getattr(tag, "color", "#1bd96a") or "#1bd96a"

        with ui.card().classes("p-3 rounded-xl flex items-center justify-between w-full").style(
            f"background: var(--bg-surface); border: 1px solid {color}35;"
        ):
            with ui.row().classes("items-center gap-2.5"):
                ui.element("div").style(
                    f"width: 14px; height: 14px; border-radius: 4px; background: {color}; box-shadow: 0 0 8px {color}66;"
                )
                with ui.column().classes("gap-0"):
                    ui.label(f"#{tag.name}").style(f"font-weight: 700; color: {color}; font-size: 0.95rem;")
                    ui.label(f"{usage_count} litemáticas").style("color: var(--text-muted); font-size: 0.75rem;")

            with ui.row().classes("gap-1"):
                ui.button(
                    icon="edit",
                    on_click=lambda _t=tag: self._open_edit_dialog(_t),
                ).classes("btn-ghost-icon").props("flat round dense size=sm").tooltip("Editar tag")
                ui.button(
                    icon="delete",
                    on_click=lambda _t=tag: self._confirm_delete(_t),
                ).classes("btn-ghost-icon btn-danger").props("flat round dense size=sm").tooltip("Eliminar tag")

    # Dialogs ─────────────────────────────────────────────────────────────

    def _open_create_dialog(self) -> None:
        selected_color = {"val": "#ef4444"}

        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label("Crear Nuevo Tag").classes("dialog-title")
                name_input = ui.input(
                    "Nombre del tag",
                    placeholder="Ej: redstone, granja, portal",
                ).classes("w-full")

                ui.label("Color del Tag").classes("meta-label mt-3 mb-1")
                color_row = ui.row().classes("flex-wrap gap-2")

                with color_row:
                    for hex_col, col_name in MINECRAFT_COLOR_PALETTE:
                        def _set_col(c=hex_col):
                            selected_color["val"] = c
                            _update_indicators()

                        ui.button(
                            on_click=_set_col,
                        ).props("round flat size=sm").style(
                            f"background: {hex_col}; width: 26px; height: 26px; min-height: 26px; border: 2px solid rgba(255,255,255,0.2);"
                        ).tooltip(col_name)

                preview_pill = ui.badge("#nombre").classes("tag-chip mt-2").style("background: #ef444425; color: #ef4444; border-color: #ef4444;")

                def _update_indicators():
                    c = selected_color["val"]
                    n = name_input.value.strip() or "nombre"
                    preview_pill.text = f"#{n}"
                    preview_pill.style(f"background: {c}25; color: {c}; border-color: {c};")

                name_input.on("input", _update_indicators)

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Crear Tag", on_click=lambda: self._create(
                        dialog, name_input.value, selected_color["val"]
                    )).classes("btn-primary")

    def _open_edit_dialog(self, tag: Tag) -> None:
        cur_color = getattr(tag, "color", "#1bd96a") or "#1bd96a"
        selected_color = {"val": cur_color}

        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label(f"Editar Tag: #{tag.name}").classes("dialog-title")
                name_input = ui.input("Nombre", value=tag.name).classes("w-full")

                ui.label("Color del Tag").classes("meta-label mt-3 mb-1")
                with ui.row().classes("flex-wrap gap-2"):
                    for hex_col, col_name in MINECRAFT_COLOR_PALETTE:
                        def _set_col(c=hex_col):
                            selected_color["val"] = c
                            _update_indicators()

                        ui.button(
                            on_click=_set_col,
                        ).props("round flat size=sm").style(
                            f"background: {hex_col}; width: 26px; height: 26px; min-height: 26px; border: 2px solid rgba(255,255,255,0.2);"
                        ).tooltip(col_name)

                preview_pill = ui.badge(f"#{tag.name}").classes("tag-chip mt-2").style(f"background: {cur_color}25; color: {cur_color}; border-color: {cur_color};")

                def _update_indicators():
                    c = selected_color["val"]
                    n = name_input.value.strip() or tag.name
                    preview_pill.text = f"#{n}"
                    preview_pill.style(f"background: {c}25; color: {c}; border-color: {c};")

                name_input.on("input", _update_indicators)

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Guardar", on_click=lambda: self._update(
                        dialog, tag.id, name_input.value, selected_color["val"]
                    )).classes("btn-primary")

    def _confirm_delete(self, tag: Tag) -> None:
        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label(f"¿Eliminar el tag «#{tag.name}»?").classes("dialog-title")
                ui.label(
                    "Se desvinculará de todos los schematics que lo tengan asignado."
                ).classes("text-sm").style("color: var(--text-secondary)")

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Eliminar", on_click=lambda: self._delete(
                        dialog, tag.id
                    )).classes("btn-danger-solid")

    # CRUD ops ─────────────────────────────────────────────────────────────

    def _create(self, dialog, name: str, color: str) -> None:
        name = name.strip().lower()
        if not name:
            ui.notify("El nombre no puede estar vacío", color="negative")
            return
        with get_session() as session:
            existing = session.exec(select(Tag).where(Tag.name == name)).first()
            if existing:
                ui.notify(f"El tag «#{name}» ya existe", color="warning")
                return
            tag = Tag(name=name, color=color)
            session.add(tag)
            session.commit()
        dialog.close()
        ui.notify(f"Tag «#{name}» creado", color="positive", position="bottom-right")
        self._render_list()

    def _update(self, dialog, tag_id: int, name: str, color: str) -> None:
        name = name.strip().lower()
        if not name:
            ui.notify("El nombre no puede estar vacío", color="negative")
            return
        with get_session() as session:
            tag = session.get(Tag, tag_id)
            if tag:
                tag.name = name
                tag.color = color
                session.add(tag)
                session.commit()
        dialog.close()
        ui.notify("Tag actualizado", color="positive", position="bottom-right")
        self._render_list()

    def _delete(self, dialog, tag_id: int) -> None:
        with get_session() as session:
            links = session.exec(
                select(SchematicTagLink).where(SchematicTagLink.tag_id == tag_id)
            ).all()
            for link in links:
                session.delete(link)
            tag = session.get(Tag, tag_id)
            if tag:
                session.delete(tag)
            session.commit()
        dialog.close()
        ui.notify("Tag eliminado", color="info", position="bottom-right")
        self._render_list()
