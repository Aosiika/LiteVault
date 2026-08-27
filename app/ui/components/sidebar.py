"""
sidebar.py — Panel lateral con categorías colapsables y tags de alto contraste estilo Modrinth.
"""

from __future__ import annotations

from typing import Callable, Optional

from nicegui import ui
from sqlmodel import select, func

from app.db.database import get_session
from app.db.models import Category, Schematic, Tag


class Sidebar:
    """
    Panel lateral izquierdo de LiteVault.
    
    Muestra:
    - Botón "Todas" para resetear filtros
    - Árbol de categorías colapsables/expandibles
    - Lista de tags con texto de alto contraste y color temático
    
    Notifica cambios via on_filter_change(category_id, tag_ids).
    """

    def __init__(
        self,
        on_filter_change: Callable[[Optional[int], list[int]], None],
    ):
        self._on_filter_change = on_filter_change
        self._selected_category: Optional[int] = None
        self._selected_tags: set[int] = set()
        self._expanded_categories: set[int] = set()
        self._tag_elements: dict[int, tuple[ui.element, str]] = {}
        self._init_expanded()
        self._build()

    def _init_expanded(self) -> None:
        """Inicializa las categorías raíz como expandidas por defecto."""
        with get_session() as session:
            roots = session.exec(select(Category.id).where(Category.parent_id == None)).all()
            self._expanded_categories = set(roots)

    # Build ──────────────────────────────────────────────────────────────

    def _build(self) -> None:
        with ui.column().classes("sidebar"):
            # Botón "Todas las litemáticas"
            is_all_active = self._selected_category is None and not self._selected_tags
            with ui.row().classes("w-full"):
                ui.button(
                    "Todas las litemáticas",
                    icon="grid_view",
                    on_click=self._clear_filters,
                ).classes(f"w-full justify-start {'btn-primary' if is_all_active else 'btn-secondary'}").style("font-size:0.85rem;")

            ui.separator().style("border-color: var(--border); margin: 6px 0;")

            # Encabezado Categorías
            with ui.row().classes("items-center justify-between w-full px-2"):
                ui.label("CATEGORÍAS").classes("sidebar-section-title")
                with ui.row().classes("items-center gap-1"):
                    ui.button(
                        icon="unfold_more",
                        on_click=self._toggle_all_categories,
                    ).props("flat round dense size=xs").classes("text-[var(--text-secondary)]").tooltip("Expandir/Contraer todas")
                    ui.button(
                        icon="add",
                        on_click=lambda: ui.navigate.to("/categories"),
                    ).props("flat round dense size=xs").classes("text-[var(--accent)]").tooltip("Gestionar categorías")

            self._category_container = ui.column().classes("w-full gap-0.5")
            self._render_categories()

            ui.separator().style("border-color: var(--border); margin: 6px 0;")

            # Encabezado Tags
            with ui.row().classes("items-center justify-between w-full px-2"):
                ui.label("TAGS").classes("sidebar-section-title")
                ui.button(
                    icon="edit",
                    on_click=lambda: ui.navigate.to("/tags"),
                ).props("flat round dense size=xs").classes("text-[var(--accent)]").tooltip("Gestionar tags")

            self._tags_container = ui.row().classes("flex-wrap gap-1.5 px-1")
            self._render_tags()

    # Categorías ─────────────────────────────────────────────────────────

    def _render_categories(self) -> None:
        self._category_container.clear()
        with self._category_container:
            with get_session() as session:
                # 1 sola query para todas las categorías
                all_cats = session.exec(select(Category).order_by(Category.name)).all()
                # 1 sola query para los conteos agrupados
                raw_counts = session.exec(
                    select(Schematic.category_id, func.count(Schematic.id)).group_by(Schematic.category_id)
                ).all()
                counts_map: dict[int, int] = {cat_id: c for cat_id, c in raw_counts if cat_id is not None}

                # Construir mapa de hijos en memoria
                children_map: dict[Optional[int], list[Category]] = {}
                for cat in all_cats:
                    children_map.setdefault(cat.parent_id, []).append(cat)

                roots = children_map.get(None, [])

                if not roots:
                    ui.label("Sin categorías").style("color:var(--text-muted); font-size:0.78rem; padding: 4px 10px;")

                for cat in roots:
                    self._render_category_node(cat, children_map, counts_map, indent=0)

    def _render_category_node(
        self,
        cat: Category,
        children_map: dict[Optional[int], list[Category]],
        counts_map: dict[int, int],
        indent: int,
    ) -> None:
        is_selected = self._selected_category == cat.id
        is_expanded = cat.id in self._expanded_categories
        indent_px = 6 + indent * 14

        # Conteo O(1) desde memoria
        count = counts_map.get(cat.id, 0)
        children = children_map.get(cat.id, [])

        with ui.element("div").classes(
            f"category-item {'category-selected' if is_selected else ''} items-center justify-between"
        ).style(f"padding-left: {indent_px}px;"):
            
            with ui.row().classes("items-center gap-1.5 flex-1 min-w-0"):
                # Icono chevron expandible si tiene hijos
                if children:
                    chevron_icon = "expand_more" if is_expanded else "chevron_right"
                    (
                        ui.button(
                            icon=chevron_icon,
                            on_click=lambda _c=cat: self._toggle_expand(_c.id),
                        )
                        .props("flat round dense size=xs")
                        .style("color: var(--text-secondary); width: 20px; height: 20px; min-height: 20px;")
                    )
                else:
                    ui.element("div").style("width: 20px;")

                folder_icon = "folder_open" if (is_selected or is_expanded) else "folder"
                ui.icon(folder_icon, size="1.05rem").style(
                    f"color: {'var(--accent)' if is_selected else 'var(--text-secondary)'}; flex-shrink: 0;"
                )
                ui.label(cat.name).classes("category-label").style(
                    "white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"
                ).on("click", lambda _c=cat: self._select_category(_c.id))

            if count > 0:
                ui.badge(str(count)).classes("count-badge").style("font-size:0.65rem; padding:1px 6px; flex-shrink: 0;")

        # Renderizar hijos sólo si está expandido
        if children and is_expanded:
            for child in children:
                self._render_category_node(child, children_map, counts_map, indent + 1)

    def _toggle_expand(self, category_id: int) -> None:
        if category_id in self._expanded_categories:
            self._expanded_categories.discard(category_id)
        else:
            self._expanded_categories.add(category_id)
        self._render_categories()

    def _toggle_all_categories(self) -> None:
        with get_session() as session:
            all_ids = set(session.exec(select(Category.id)).all())
        if len(self._expanded_categories) > 0:
            self._expanded_categories.clear()
        else:
            self._expanded_categories = all_ids
        self._render_categories()

    def _select_category(self, category_id: int) -> None:
        if self._selected_category == category_id:
            self._selected_category = None
        else:
            self._selected_category = category_id
            self._expanded_categories.add(category_id)
        self._render_categories()
        self._emit()

    # Tags con Alto Contraste ─────────────────────────────────────────────

    def _render_tags(self) -> None:
        self._tags_container.clear()
        self._tag_elements.clear()

        with self._tags_container:
            with get_session() as session:
                tags = session.exec(select(Tag).order_by(Tag.name)).all()

            if not tags:
                ui.label("Sin tags").style("color:var(--text-muted); font-size:0.78rem; padding: 4px 8px;")
                return

            for tag in tags:
                is_active = tag.id in self._selected_tags
                color = getattr(tag, "color", "#1bd96a") or "#1bd96a"

                # Chip con diseño de alto contraste y punto de color
                chip = ui.element("div").classes(
                    "cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-xs select-none"
                ).on("click", lambda _t=tag: self._toggle_tag(_t.id))

                self._tag_elements[tag.id] = (chip, color)
                self._update_chip_style(chip, color, is_active, tag.name)

    def _update_chip_style(self, chip: ui.element, color: str, is_active: bool, tag_name: str) -> None:
        chip.clear()
        with chip:
            # Indicador de color Minecraft
            ui.element("div").style(
                f"width: 7px; height: 7px; border-radius: 50%; background: {color}; box-shadow: 0 0 6px {color}88; flex-shrink: 0;"
            )
            # Texto nítido con alto contraste
            text_color = "#ffffff" if is_active else "#e2e8f0"
            ui.label(f"#{tag_name}").style(
                f"color: {text_color}; font-weight: {'700' if is_active else '600'}; font-size: 0.76rem; letter-spacing: 0.01em;"
            )

        if is_active:
            chip.style(
                f"background: {color}35 !important; border: 1.5px solid {color} !important; box-shadow: 0 0 10px {color}40 !important;"
            )
        else:
            chip.style(
                f"background: #1c1e26 !important; border: 1px solid {color}55 !important;"
            )

    def _toggle_tag(self, tag_id: int) -> None:
        if tag_id in self._selected_tags:
            self._selected_tags.discard(tag_id)
        else:
            self._selected_tags.add(tag_id)

        with get_session() as session:
            tag = session.get(Tag, tag_id)
            tag_name = tag.name if tag else ""

        if tag_id in self._tag_elements:
            chip, color = self._tag_elements[tag_id]
            is_active = tag_id in self._selected_tags
            self._update_chip_style(chip, color, is_active, tag_name)

        self._emit()

    # Reset y emisión ─────────────────────────────────────────────────────

    def _clear_filters(self) -> None:
        self._selected_category = None
        self._selected_tags.clear()
        self._render_categories()
        self._render_tags()
        self._emit()

    def _emit(self) -> None:
        self._on_filter_change(self._selected_category, list(self._selected_tags))
