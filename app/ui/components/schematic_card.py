"""
schematic_card.py — Tarjeta de schematic estilo Modrinth / Minecraft.
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Optional

from nicegui import ui

from app.config import thumb_to_url
from app.db.models import Schematic


class SchematicCard:
    """
    Tarjeta visual para un schematic individual.

    Args:
        schematic:   El objeto Schematic a mostrar.
        on_select:   Callback (schematic_id, selected: bool) al marcar checkbox.
        on_click:    Callback (schematic_id) al hacer click → abre el viewer.
        on_delete:   Callback (schematic_id) al pulsar el botón de borrar.
        is_selected: Estado inicial de selección.
    """

    def __init__(
        self,
        schematic: Schematic,
        on_select: Callable[[int, bool], None],
        on_click: Callable[[int], None],
        on_delete: Callable[[int], None],
        is_selected: bool = False,
    ):
        self.schematic = schematic
        self._on_select = on_select
        self._on_click = on_click
        self._on_delete = on_delete
        self._selected = is_selected
        self._checkbox: Optional[ui.checkbox] = None
        self._build()

    def _build(self) -> None:
        from app.i18n import _t
        s = self.schematic

        with ui.card().classes(
            f"schematic-card {'schematic-card-selected' if self._selected else ''} hover-float glass-panel"
        ) as card:
            self._card = card

            # Overlay de acciones en hover (eliminar + checkbox) ───────────
            with ui.row().classes("card-actions items-center gap-1.5"):
                self._checkbox = (
                    ui.checkbox(value=self._selected, on_change=self._handle_checkbox)
                    .classes("card-checkbox")
                    .props("dense dark")
                    .on("click.stop", lambda: None)
                )
                (
                    ui.button(icon="delete", on_click=self._handle_delete)
                    .classes("card-delete-btn hover:scale-110 transition-transform")
                    .props("flat round dense size=sm")
                    .on("click.stop", lambda: None)
                    .tooltip(_t("card.delete"))
                )

            # Cuerpo de la tarjeta (click → detalle) ───────────────────────
            with ui.element("div").classes("w-full flex flex-col cursor-pointer").on("click", self._handle_click):
                with ui.element("div").classes("card-thumbnail-wrapper"):
                    thumb_url = thumb_to_url(s.thumbnail_path)
                    if thumb_url:
                        # Añadimos loading lazy nativo para optimizar el renderizado del DOM en listas largas
                        ui.image(thumb_url).classes("card-thumbnail-img").props('loading="lazy" decoding="async"')
                    else:
                        ui.icon("inventory_2", size="3rem").style("color: var(--border-hover)")

                # Información y Metadatos
                with ui.element("div").classes("card-body"):
                    ui.label(s.name).classes("card-title").tooltip(s.name)

                    with ui.row().classes("items-center gap-1.5 flex-wrap"):
                        if s.dimensions:
                            with ui.element("div").classes("card-meta-pill"):
                                ui.icon("straighten", size="0.8rem").style("color: var(--accent-light)")
                                ui.label(s.dimensions)

                        if s.block_count is not None:
                            with ui.element("div").classes("card-meta-pill"):
                                ui.icon("view_in_ar", size="0.8rem").style("color: var(--accent)")
                                ui.label(f"{s.block_count:,} {_t('card.blocks')}")
                                
                        if getattr(s, "minecraft_version", None):
                            with ui.element("div").classes("card-meta-pill").style("background: rgba(230,150,30,0.1); border-color: rgba(230,150,30,0.3);"):
                                ui.icon("extension", size="0.8rem").style("color: #e6961e;")
                                ui.label(s.minecraft_version).style("color: #e6961e; font-weight: 600;")

                    tags = getattr(s, "_cached_tags", None)
                    if tags is None:
                        tags = s.tags
                    if tags:
                        with ui.row().classes("flex-wrap gap-1 mt-1"):
                            for tag in tags[:3]:
                                color = getattr(tag, "color", "#1bd96a") or "#1bd96a"
                                ui.badge(f"#{tag.name}").classes("tag-chip").style(
                                    f"font-size:0.68rem; padding:2px 7px; border-color:{color}55; color:{color}; background:{color}18;"
                                )
                            if len(tags) > 3:
                                ui.badge(f"+{len(tags) - 3}").classes("tag-chip").style("font-size:0.68rem; padding:2px 6px; opacity:0.75;")

    # Handlers ─────────────────────────────────────────────────────────────

    def _handle_click(self) -> None:
        self._on_click(self.schematic.id)

    def _handle_checkbox(self, e) -> None:
        self._selected = e.value
        self._on_select(self.schematic.id, e.value)
        self._update_style()

    def _handle_delete(self) -> None:
        """Muestra confirmación antes de eliminar."""
        with ui.dialog() as confirm:
            confirm.open()
            with ui.card().classes("dialog-card"):
                ui.label(f"¿Eliminar «{self.schematic.name}»?").classes("dialog-title")
                ui.label(
                    "Se eliminará el archivo .litematic del storage y todos sus datos."
                ).style("color:var(--text-secondary); font-size:0.85rem")
                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=confirm.close).classes("btn-secondary")
                    ui.button(
                        "Eliminar",
                        icon="delete",
                        on_click=lambda: self._confirm_delete(confirm),
                    ).classes("btn-danger-solid")

    def _confirm_delete(self, dialog) -> None:
        dialog.close()
        self._on_delete(self.schematic.id)

    def _update_style(self) -> None:
        if self._selected:
            self._card.classes(add="schematic-card-selected")
        else:
            self._card.classes(remove="schematic-card-selected")
