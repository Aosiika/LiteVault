"""
categories.py — CRUD de categorías y subcategorías.
"""

from __future__ import annotations

from typing import Optional

from nicegui import ui
from sqlmodel import select

from app.db.database import get_session
from app.db.models import Category, CategoryCreate, CategoryUpdate


class CategoriesPage:
    """Página CRUD para gestionar categorías y subcategorías."""

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
                    ui.icon("folder", size="1.6rem").style("color: var(--accent)")
                    ui.label("Gestión de Categorías").classes("page-title")

                ui.button(
                    "Nueva categoría",
                    icon="add",
                    on_click=lambda: self._open_create_dialog(parent_id=None),
                ).classes("btn-primary")

            # Árbol de categorías
            self._tree_container = ui.column().classes("w-full gap-2")
            self._render_tree()

    # Árbol ───────────────────────────────────────────────────────────────

    def _render_tree(self) -> None:
        self._tree_container.clear()
        with self._tree_container:
            with get_session() as session:
                roots = session.exec(
                    select(Category).where(Category.parent_id == None)  # noqa: E711
                ).all()
                for cat in roots:
                    self._render_node(cat, session, depth=0)

    def _render_node(self, cat: Category, session, depth: int) -> None:
        indent = depth * 24
        children = session.exec(
            select(Category).where(Category.parent_id == cat.id)
        ).all()

        with ui.row().classes("crud-row items-center gap-2").style(
            f"padding-left: {indent + 12}px"
        ):
            ui.icon(
                "expand_more" if children else "chevron_right",
                size="1rem",
            ).style("color: var(--text-muted)")
            ui.icon("folder", size="1rem").style("color: var(--accent-light)")
            ui.label(cat.name).classes("crud-item-name flex-1")

            # Acciones
            with ui.row().classes("gap-1"):
                ui.button(
                    icon="create_new_folder",
                    on_click=lambda _c=cat: self._open_create_dialog(parent_id=_c.id),
                ).classes("btn-ghost-icon").tooltip("Añadir subcategoría")
                ui.button(
                    icon="edit",
                    on_click=lambda _c=cat: self._open_edit_dialog(_c),
                ).classes("btn-ghost-icon").tooltip("Renombrar")
                ui.button(
                    icon="delete",
                    on_click=lambda _c=cat: self._confirm_delete(_c),
                ).classes("btn-ghost-icon btn-danger").tooltip("Eliminar")

        for child in children:
            self._render_node(child, session, depth + 1)

    # Dialogs ─────────────────────────────────────────────────────────────

    def _open_create_dialog(self, parent_id: Optional[int]) -> None:
        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label(
                    "Nueva subcategoría" if parent_id else "Nueva categoría"
                ).classes("dialog-title")

                name_input = ui.input(
                    "Nombre",
                    placeholder="Ej: Casas medievales",
                ).classes("w-full")

                # Selector de padre (si no se pasó parent_id)
                parent_select = None
                if parent_id is None:
                    with get_session() as session:
                        cats = session.exec(select(Category)).all()
                    options = {"": "— Sin padre (raíz) —"}
                    options.update({str(c.id): c.name for c in cats})
                    parent_select = ui.select(
                        options, label="Categoría padre (opcional)"
                    ).classes("w-full")

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Crear", on_click=lambda: self._create(
                        dialog,
                        name_input.value,
                        parent_id or (
                            int(parent_select.value) if parent_select and parent_select.value else None
                        ),
                    )).classes("btn-primary")

    def _open_edit_dialog(self, cat: Category) -> None:
        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label(f"Renombrar: {cat.name}").classes("dialog-title")
                name_input = ui.input("Nombre", value=cat.name).classes("w-full")

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Guardar", on_click=lambda: self._update(
                        dialog, cat.id, name_input.value
                    )).classes("btn-primary")

    def _confirm_delete(self, cat: Category) -> None:
        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("dialog-card"):
                ui.label(f"¿Eliminar «{cat.name}»?").classes("dialog-title")
                ui.label(
                    "Esto también eliminará sus subcategorías. "
                    "Los schematics asignados quedarán sin categoría."
                ).classes("text-sm").style("color: var(--text-secondary)")

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=dialog.close).classes("btn-secondary")
                    ui.button("Eliminar", on_click=lambda: self._delete(
                        dialog, cat.id
                    )).classes("btn-danger")

    # CRUD ops ─────────────────────────────────────────────────────────────

    def _create(self, dialog, name: str, parent_id: Optional[int]) -> None:
        name = name.strip()
        if not name:
            ui.notify("El nombre no puede estar vacío", color="negative")
            return
        with get_session() as session:
            cat = Category(name=name, parent_id=parent_id)
            session.add(cat)
            session.commit()
        dialog.close()
        ui.notify(f"Categoría «{name}» creada", color="positive", position="bottom-right")
        self._render_tree()

    def _update(self, dialog, cat_id: int, name: str) -> None:
        name = name.strip()
        if not name:
            ui.notify("El nombre no puede estar vacío", color="negative")
            return
        with get_session() as session:
            cat = session.get(Category, cat_id)
            if cat:
                cat.name = name
                session.add(cat)
                session.commit()
        dialog.close()
        ui.notify("Categoría actualizada", color="positive", position="bottom-right")
        self._render_tree()

    def _delete(self, dialog, cat_id: int) -> None:
        with get_session() as session:
            self._delete_recursive(session, cat_id)
            session.commit()
        dialog.close()
        ui.notify("Categoría eliminada", color="info", position="bottom-right")
        self._render_tree()

    def _delete_recursive(self, session, cat_id: int) -> None:
        """Elimina una categoría y todas sus subcategorías recursivamente."""
        children = session.exec(
            select(Category).where(Category.parent_id == cat_id)
        ).all()
        for child in children:
            self._delete_recursive(session, child.id)

        cat = session.get(Category, cat_id)
        if cat:
            session.delete(cat)
