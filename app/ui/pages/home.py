"""
home.py — Página principal de LiteVault: galería con filtros y acciones.
"""

from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from nicegui import app, ui
from sqlmodel import select

from app.db.database import get_session
from app.db.models import Category, Schematic, SchematicTagLink, Tag
from app.services import file_service
from app.ui.components.schematic_card import SchematicCard
from app.ui.components.sidebar import Sidebar
from app.ui.components.viewer_webview import open_viewer_dialog


def open_discord_sync_dialog(on_completed: Optional[callable] = None) -> None:
    """Diálogo modal interactivo para sincronizar con cualquier servidor de Discord."""
    from app.services.discord_sync_service import load_discord_config, save_discord_config, sync_discord_async
    from app.i18n import _t

    cfg = load_discord_config()
    cur_token = cfg.get("token") or ""
    cur_invite = cfg.get("invite_or_guild") or ""

    with ui.dialog() as dialog, ui.card().classes(
        "w-[500px] p-6 glass-panel"
    ):
        with ui.row().classes("items-center justify-between w-full mb-4"):
            with ui.row().classes("items-center gap-2"):
                ui.icon("cloud_download", size="1.5rem").style("color: var(--accent)")
                ui.label(_t("home.sync_dialog_title")).style("font-size: 1.25rem; font-weight: 700;")
            close_btn = ui.button(icon="close", on_click=dialog.close).props("flat round dense").classes("text-[var(--text-secondary)] hover:text-white transition-all")

        token_input = ui.input(
            _t("home.sync_token_label"),
            value=cur_token,
            placeholder=_t("home.sync_token_placeholder"),
            password=True,
            password_toggle_button=True,
        ).classes("w-full mb-2")

        invite_input = ui.input(
            _t("home.sync_invite_label"),
            value=cur_invite,
            placeholder=_t("home.sync_invite_placeholder"),
        ).classes("w-full mb-2")

        with ui.expansion(_t("home.sync_help_title"), icon="help_outline").classes("w-full bg-[#1a1a1a] rounded border border-[#333] mb-4"):
            ui.label(_t("home.sync_help_token_title")).classes("font-bold text-[var(--accent)] mt-2")
            ui.label(_t("home.sync_help_token_1")).classes("text-sm text-gray-400")
            ui.label(_t("home.sync_help_token_2")).classes("text-sm text-gray-400")
            ui.label(_t("home.sync_help_token_3")).classes("text-sm text-gray-400")
            ui.label(_t("home.sync_help_token_4")).classes("text-sm text-gray-400")
            ui.label(_t("home.sync_help_token_warn")).classes("text-xs text-[var(--danger)] font-bold mt-1 mb-3")
            
            ui.label(_t("home.sync_help_server_title")).classes("font-bold text-[var(--accent)]")
            ui.label(_t("home.sync_help_server_desc")).classes("text-sm text-gray-400 mb-2")

        status_label = ui.label("Listo para sincronizar.").style("color: var(--text-secondary); font-size: 0.85rem; font-weight: 500;")
        progress_bar = ui.linear_progress(value=0, show_value=False).classes("w-full my-2").props("stripe animated color=positive")
        progress_bar.visible = False

        with ui.row().classes("items-center justify-end gap-2 w-full mt-4"):
            cancel_btn = ui.button(_t("home.sync_cancel"), on_click=dialog.close).classes("btn-secondary")
            sync_btn = ui.button(_t("home.sync_start"), icon="sync").classes("btn-primary")

        async def _do_sync():
            token = token_input.value.strip()
            invite = invite_input.value.strip()
            if not token:
                ui.notify(_t("home.sync_missing_token"), color="negative")
                return
            save_discord_config(token, invite)

            dialog.props("persistent")  # Bloquear cierre accidental mientras sincroniza
            close_btn.disable()
            cancel_btn.disable()
            sync_btn.disable()
            token_input.disable()
            invite_input.disable()

            progress_bar.visible = True
            progress_bar.value = 0.05
            status_label.text = _t("home.sync_connecting")

            def _cb(msg: str, cur: int, tot: int):
                if tot > 0:
                    pct = (cur / tot) * 100
                    status_label.text = f"{msg} ({pct:.1f}%)"
                    progress_bar.value = max(0.05, min(1.0, cur / tot))
                else:
                    status_label.text = msg

            try:
                added, skipped, summary = await sync_discord_async(progress_callback=_cb)
                progress_bar.value = 1.0
                status_label.text = f"✓ {summary}"
                ui.notify(_t("home.sync_finished", added=added), color="positive", position="bottom-right")
                sync_btn.text = "Volver a Sincronizar"
                sync_btn.icon = "refresh"
                sync_btn.enable()
                cancel_btn.text = _t("home.sync_close")
                cancel_btn.enable()
                close_btn.enable()
                dialog.props(remove="persistent")
                if on_completed:
                    on_completed()
            except Exception as err:
                status_label.text = _t("home.sync_error", error=err)
                ui.notify(_t("home.sync_error", error=err), color="negative", position="bottom-right")
                sync_btn.enable()
                close_btn.enable()
                cancel_btn.enable()
                token_input.enable()
                invite_input.enable()
                dialog.props(remove="persistent")

        sync_btn.on_click(_do_sync)
    dialog.open()


class HomePage:
    """
    Página principal: sidebar + galería de alto rendimiento con búsqueda y paginación.
    """

    def __init__(self):
        self._selected_ids: set[int] = set()
        self._active_category: Optional[int] = None
        self._active_tags: list[int] = []
        self._search_query: str = ""
        self._current_page: int = 1
        self._page_size: int = 32
        self._cards: dict[int, SchematicCard] = {}
        self._grid_container: Optional[ui.element] = None
        self._pagination_container: Optional[ui.element] = None
        self._sidebar: Optional[Sidebar] = None
        self._build()

    # Layout principal ────────────────────────────────────────────────────

    def _build(self) -> None:
        def _on_sync_done():
            self._load_schematics()
            if self._sidebar:
                self._sidebar.refresh()

        async def _startup_update_check():
            from app.services.update_service import check_for_updates
            from app.ui.components.update_dialog import open_update_dialog
            has_update, new_version, notes, url = await check_for_updates()
            if has_update and url:
                open_update_dialog(new_version, notes, url, is_manual=False)

        ui.timer(2.0, _startup_update_check, once=True)

        with ui.element("div").classes("app-layout"):
            self._sidebar = Sidebar(
                on_filter_change=self._on_filter_change,
                active_tab="collection",
                on_sync_request=lambda: open_discord_sync_dialog(on_completed=_on_sync_done)
            )

            with ui.element("div").classes("main-content w-full"):
                self._build_toolbar()
                
                # Upload invisible para poder usar self._uploader en _build_toolbar
                with ui.element("div").style("display: none;"):
                    self._uploader = ui.upload(
                        multiple=False,
                        on_upload=self._handle_upload,
                        auto_upload=True
                    )
                
                self._grid_container = ui.element("div").classes("schematics-grid w-full mt-4")
                self._pagination_container = ui.row().classes("items-center justify-center gap-3 w-full py-4")
                self._load_schematics()
                self._build_fab()

    # Toolbar (Top Bar minimalista) ───────────────────────────────────────

    def _build_toolbar(self) -> None:
        from app.i18n import _t
        with ui.row().classes("toolbar items-center justify-between w-full pb-4 border-b border-[var(--border)] pt-2"):
            # Lado izquierdo (vacío o título)
            with ui.row().classes("items-center gap-2"):
                ui.label(_t("home.title")).classes("page-title").style("font-size: 1.4rem;")
                self._count_badge = ui.label("0").style(
                    "font-size: 0.9rem; font-weight: 800; padding: 4px 10px; border-radius: 12px; "
                    "background: rgba(27, 217, 106, 0.15) !important; color: var(--accent-light) !important; "
                    "border: 1px solid rgba(27, 217, 106, 0.3) !important; display: inline-block; line-height: 1;"
                )

            # Centro: Buscador
            with ui.row().classes("items-center flex-1 justify-center"):
                self._search_input = (
                    ui.input(
                        placeholder=_t("home.search_placeholder"),
                        on_change=lambda e: self._on_search(e.value or "")
                    )
                    .props("dense outlined rounded clearable")
                    .classes("w-[400px] max-w-[50vw] search-input-custom")
                )
                with self._search_input.add_slot("append"):
                    ui.icon("search", size="1.2rem").classes("text-[var(--text-muted)] cursor-pointer")

            # Derecha: Botón importar discreto
            with ui.row().classes("items-center justify-end gap-2"):
                ui.button(
                    _t("home.import_title", default="Importar"),
                    icon="file_upload",
                    on_click=self._import_native,
                ).classes("btn-primary").props("dense").style("font-size: 0.85rem; padding: 4px 16px;")

    def _on_search(self, val: str) -> None:
        self._search_query = val.strip().lower()
        self._current_page = 1
        self._load_schematics()

    # Grid de cards con Carga Optimizada ────────────────────────────────────

    def _load_schematics(self) -> None:
        self._grid_container.clear()
        self._pagination_container.clear()
        self._cards.clear()

        from sqlmodel import or_, func

        with get_session() as session:
            # 1. Construir query base
            query = select(Schematic)
            
            # 1.1 Filtrar por categoría
            if self._active_category is not None:
                cat_ids = [self._active_category]
                to_check = [self._active_category]
                while to_check:
                    current = to_check.pop(0)
                    children = session.exec(select(Category.id).where(Category.parent_id == current)).all()
                    cat_ids.extend(children)
                    to_check.extend(children)
                query = query.where(Schematic.category_id.in_(cat_ids))

            # 1.2 Filtrar por búsqueda
            q = self._search_query
            if q:
                query = query.where(
                    or_(
                        Schematic.name.icontains(q),
                        Schematic.description.icontains(q)
                    )
                )

            # 1.3 Filtrar por tags (Lógica OR: coincide con cualquier tag seleccionado)
            tag_set = set(self._active_tags) if self._active_tags else None
            if tag_set:
                query = query.join(SchematicTagLink).where(SchematicTagLink.tag_id.in_(tag_set)).distinct()

            # 2. Render agrupado si no hay filtros
            if not self._active_category and not tag_set and not q:
                self._pagination_container.clear()
                total_items = session.exec(select(func.count(Schematic.id))).one()
                self._count_badge.text = str(total_items)
                
                with self._grid_container:
                    if total_items == 0:
                        self._render_empty_state(is_totally_empty=True)
                    else:
                        self._render_grouped_recent(session)
                return

            # 3. Paginación y Conteo (cuando hay filtros)
            total_items = session.exec(select(func.count()).select_from(query.subquery())).one()
            self._count_badge.text = str(total_items)

            total_pages = max(1, (total_items + self._page_size - 1) // self._page_size)
            if self._current_page > total_pages:
                self._current_page = total_pages

            start_idx = (self._current_page - 1) * self._page_size
            
            # Ejecutar consulta SQL con LIMIT y OFFSET
            page_items = session.exec(query.order_by(Schematic.name).offset(start_idx).limit(self._page_size)).all()

            # 4. Carga en bloque (Batch) de tags SÓLO para los items de la página actual
            if page_items:
                item_ids = [s.id for s in page_items]
                links = session.exec(select(SchematicTagLink).where(SchematicTagLink.schematic_id.in_(item_ids))).all()
                tags_needed = {link.tag_id for link in links}
                
                if tags_needed:
                    tag_objs = {t.id: t for t in session.exec(select(Tag).where(Tag.id.in_(tags_needed))).all()}
                else:
                    tag_objs = {}
                
                schem_tags_map = {}
                for l in links:
                    if l.tag_id in tag_objs:
                        schem_tags_map.setdefault(l.schematic_id, []).append(tag_objs[l.tag_id])
                
                for s in page_items:
                    setattr(s, "_cached_tags", schem_tags_map.get(s.id, []))
            
            with self._grid_container:
                if not page_items:
                    self._render_empty_state()
                else:
                    for schem in page_items:
                        card = SchematicCard(
                            schematic=schem,
                            on_select=self._on_card_select,
                            on_click=self._on_card_click,
                            on_delete=self._on_card_delete,
                            is_selected=schem.id in self._selected_ids,
                        )
                        self._cards[schem.id] = card

            # Controles de paginación si hay más de 1 página
            if total_pages > 1:
                with self._pagination_container:
                    prev_btn = ui.button(
                        "Anterior",
                        icon="chevron_left",
                        on_click=self._prev_page,
                    ).classes("btn-secondary")
                    if self._current_page <= 1:
                        prev_btn.disable()

                    ui.label(
                        f"Página {self._current_page} de {total_pages} ({total_items} litemáticas)"
                    ).style("font-size:0.85rem; font-weight:600; color:var(--text-secondary);")

                    next_btn = ui.button(
                        "Siguiente",
                        icon="chevron_right",
                        on_click=lambda _tot=total_pages: self._next_page(_tot),
                    ).classes("btn-secondary")
                    if self._current_page >= total_pages:
                        next_btn.disable()

    def _prev_page(self) -> None:
        if self._current_page > 1:
            self._current_page -= 1
            self._load_schematics()

    def _next_page(self, total_pages: int) -> None:
        if self._current_page < total_pages:
            self._current_page += 1
            self._load_schematics()

    def _render_empty_state(self, is_totally_empty: bool = False) -> None:
        from app.i18n import _t
        if is_totally_empty:
            with ui.column().classes("w-full items-center justify-center p-8"):
                ui.label(_t("home.empty_dashboard_title")).classes("text-3xl font-bold text-white mb-2")
                ui.label(_t("home.empty_dashboard_subtitle")).classes("text-[var(--text-secondary)] mb-8")
                
                with ui.row().classes("w-full max-w-4xl gap-6 justify-center"):
                    # Tarjeta 1: Discord
                    with ui.card().classes("glass-panel flex-1 min-w-[250px] p-6 items-center text-center hover:border-[var(--accent)] transition-colors"):
                        ui.icon("cloud_download", size="3rem").classes("text-[var(--accent)] mb-4")
                        ui.label(_t("home.empty_dash_1_title")).classes("text-xl font-bold text-white mb-2")
                        ui.label(_t("home.empty_dash_1_desc")).classes("text-sm text-gray-400")

                    # Tarjeta 2: Importar
                    with ui.card().classes("glass-panel flex-1 min-w-[250px] p-6 items-center text-center hover:border-[var(--accent)] transition-colors"):
                        ui.icon("file_upload", size="3rem").classes("text-[#1bd96a] mb-4")
                        ui.label(_t("home.empty_dash_2_title")).classes("text-xl font-bold text-white mb-2")
                        ui.label(_t("home.empty_dash_2_desc")).classes("text-sm text-gray-400")
                        
                    # Tarjeta 3: Explorar
                    with ui.card().classes("glass-panel flex-1 min-w-[250px] p-6 items-center text-center hover:border-[var(--accent)] transition-colors"):
                        ui.icon("3d_rotation", size="3rem").classes("text-orange-400 mb-4")
                        ui.label(_t("home.empty_dash_3_title")).classes("text-xl font-bold text-white mb-2")
                        ui.label(_t("home.empty_dash_3_desc")).classes("text-sm text-gray-400")

        else:
            with ui.column().classes("empty-state items-center justify-center p-8"):
                # Lottie animation web player
                ui.html('<lottie-player src="https://lottie.host/890eb99f-e3c1-4560-afcb-ea31b54c8612/D7f232r9yD.json" background="transparent" speed="1" style="width: 220px; height: 220px; opacity: 0.8;" loop autoplay></lottie-player>')
                ui.label(_t("home.empty_title", default="No se encontraron litemáticas")).classes("empty-title mt-2")
                ui.label(_t("home.empty_subtitle", default="Prueba con otra categoría, etiqueta o término de búsqueda.")).classes("empty-subtitle text-center")

    def _render_grouped_recent(self, session) -> None:
        """Renderiza las construcciones agrupadas por categoría padre mostrando las más recientes (máximo 50 en total)."""
        from app.i18n import _t
        from sqlmodel import select
        from app.db.models import SchematicTagLink, Tag

        all_cats = session.exec(select(Category)).all()
        parent_cats = [c for c in all_cats if c.parent_id is None]
        parent_cats.sort(key=lambda x: x.name)
        
        def get_all_children_recursively(cid: int) -> list[int]:
            result = [cid]
            to_process = [cid]
            while to_process:
                current = to_process.pop(0)
                children = [c.id for c in all_cats if c.parent_id == current]
                result.extend(children)
                to_process.extend(children)
            return result

        total_shown = 0
        MAX_GLOBAL = 150

        with ui.column().classes("w-full gap-8 mt-2"):
            for p in parent_cats:
                if total_shown >= MAX_GLOBAL:
                    break
                    
                cat_ids = get_all_children_recursively(p.id)
                items = session.exec(
                    select(Schematic)
                    .where(Schematic.category_id.in_(cat_ids))
                    .order_by(Schematic.id.desc())
                    .limit(min(12, MAX_GLOBAL - total_shown))
                ).all()
                
                if not items:
                    continue

                # Cargar tags de los items mostrados
                item_ids = [s.id for s in items]
                links = session.exec(select(SchematicTagLink).where(SchematicTagLink.schematic_id.in_(item_ids))).all()
                if links:
                    tags_needed = {link.tag_id for link in links}
                    tag_objs = {t.id: t for t in session.exec(select(Tag).where(Tag.id.in_(tags_needed))).all()}
                    schem_tags_map = {}
                    for l in links:
                        if l.tag_id in tag_objs:
                            schem_tags_map.setdefault(l.schematic_id, []).append(tag_objs[l.tag_id])
                    for s in items:
                        setattr(s, "_cached_tags", schem_tags_map.get(s.id, []))
                else:
                    for s in items:
                        setattr(s, "_cached_tags", [])

                total_shown += len(items)
                
                with ui.column().classes("w-full gap-3"):
                    with ui.row().classes("items-center justify-between w-full px-2"):
                        with ui.row().classes("items-center gap-2"):
                            ui.icon("folder_special", size="1.2rem").style("color: var(--accent)")
                            ui.label(p.name).style("font-size: 1.15rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.05em;")
                        
                        ui.button(_t("home.view_all", default="Ver todos"), on_click=lambda _id=p.id: self._on_filter_change(_id, [])).props("outline rounded size=sm").style("border-color: rgba(27, 217, 106, 0.4); color: var(--accent-light); font-weight: 600; padding: 4px 16px; font-size: 0.75rem;")
                    
                    with ui.element("div").classes("schematics-grid-single-row"):
                        for schem in items:
                            card = SchematicCard(
                                schematic=schem,
                                on_select=self._on_card_select,
                                on_click=self._on_card_click,
                                on_delete=self._on_card_delete,
                                is_selected=schem.id in self._selected_ids,
                            )
                            self._cards[schem.id] = card

            if total_shown < MAX_GLOBAL:
                items_no_cat = session.exec(
                    select(Schematic)
                    .where(Schematic.category_id == None)
                    .order_by(Schematic.id.desc())
                    .limit(min(12, MAX_GLOBAL - total_shown))
                ).all()

                if items_no_cat:
                    item_ids = [s.id for s in items_no_cat]
                    links = session.exec(select(SchematicTagLink).where(SchematicTagLink.schematic_id.in_(item_ids))).all()
                    if links:
                        tags_needed = {link.tag_id for link in links}
                        tag_objs = {t.id: t for t in session.exec(select(Tag).where(Tag.id.in_(tags_needed))).all()}
                        schem_tags_map = {}
                        for l in links:
                            if l.tag_id in tag_objs:
                                schem_tags_map.setdefault(l.schematic_id, []).append(tag_objs[l.tag_id])
                        for s in items_no_cat:
                            setattr(s, "_cached_tags", schem_tags_map.get(s.id, []))
                    else:
                        for s in items_no_cat:
                            setattr(s, "_cached_tags", [])

                    total_shown += len(items_no_cat)
                    
                    with ui.column().classes("w-full gap-3"):
                        with ui.row().classes("items-center justify-between w-full px-2"):
                            with ui.row().classes("items-center gap-2"):
                                ui.icon("help_outline", size="1.2rem").style("color: var(--text-muted)")
                                ui.label("Sin Categoría").style("font-size: 1.15rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase;")
                        with ui.element("div").classes("schematics-grid-single-row"):
                            for schem in items_no_cat:
                                card = SchematicCard(
                                    schematic=schem,
                                    on_select=self._on_card_select,
                                    on_click=self._on_card_click,
                                    on_delete=self._on_card_delete,
                                    is_selected=schem.id in self._selected_ids,
                                )
                                self._cards[schem.id] = card

    # FAB ─────────────────────────────────────────────────────────────────

    def _build_fab(self) -> None:
        self._fab = ui.button(
            "Descargar seleccionados",
            icon="download",
            on_click=self._download_selected,
        ).classes("fab-download").style("display:none")

    def _update_fab(self) -> None:
        if self._selected_ids:
            self._fab.style("display:flex")
            self._fab.text = f"Descargar {len(self._selected_ids)} seleccionados"
        else:
            self._fab.style("display:none")

    # Diálogo de importación ───────────────────────────────────────────────

    def _open_import_dialog(self, tmp_path: Path, suggested_name: str) -> None:
        with ui.dialog() as dialog:
            dialog.open()
            with ui.card().classes("import-dialog-card"):
                with ui.row().classes("items-center justify-between w-full mb-2"):
                    with ui.row().classes("items-center gap-2"):
                        ui.icon("upload_file", size="1.2rem").style("color:var(--accent-light)")
                        ui.label("Importar schematic").classes("dialog-title").style("margin:0")
                    ui.button(icon="close", on_click=lambda: self._cancel_import(dialog, tmp_path)).classes("btn-ghost-icon")

                ui.separator().style("border-color:var(--border); margin-bottom:16px")

                name_input = ui.input("Nombre", value=suggested_name).classes("w-full")
                desc_input = ui.textarea(
                    "Descripción (opcional)", placeholder="Notas sobre esta litematica…"
                ).classes("w-full mt-2").style("min-height:60px")

                ui.label("Categoría").classes("sidebar-section-label mt-3")
                with get_session() as session:
                    cats = session.exec(select(Category).order_by(Category.name)).all()
                cat_options = {"": "— Sin categoría —"}
                cat_options.update({str(c.id): c.name for c in cats})
                cat_select = ui.select(options=cat_options, value="", label="Categoría").classes("w-full")

                ui.label("Tags").classes("sidebar-section-label mt-3")
                selected_tag_ids: set[int] = set()
                with get_session() as session:
                    all_tags = session.exec(select(Tag).order_by(Tag.name)).all()
                tag_chips_row = ui.row().classes("flex-wrap gap-2 mt-1")

                def _refresh_tags():
                    tag_chips_row.clear()
                    with tag_chips_row:
                        for tag in all_tags:
                            active = tag.id in selected_tag_ids
                            ui.button(
                                f"# {tag.name}",
                                on_click=lambda _t=tag: _toggle_tag(_t.id),
                            ).classes(f"tag-chip {'tag-chip-active' if active else ''}")
                        with ui.row().classes("items-center gap-1"):
                            new_tag_input = ui.input(placeholder="Nuevo tag…").style(
                                "max-width:130px; font-size:0.75rem"
                            )
                            ui.button(
                                icon="add",
                                on_click=lambda: _create_tag(new_tag_input.value),
                            ).classes("btn-ghost-icon").props("size=xs")

                def _toggle_tag(tid: int):
                    if tid in selected_tag_ids:
                        selected_tag_ids.discard(tid)
                    else:
                        selected_tag_ids.add(tid)
                    _refresh_tags()

                def _create_tag(name: str):
                    name = name.strip().lower()
                    if not name:
                        return
                    with get_session() as s:
                        existing = s.exec(select(Tag).where(Tag.name == name)).first()
                        if existing:
                            selected_tag_ids.add(existing.id)
                        else:
                            t = Tag(name=name)
                            s.add(t)
                            s.commit()
                            s.refresh(t)
                            all_tags.append(t)
                            selected_tag_ids.add(t.id)
                    _refresh_tags()

                _refresh_tags()

                with ui.row().classes("justify-end gap-2 mt-4"):
                    ui.button("Cancelar", on_click=lambda: self._cancel_import(dialog, tmp_path)).classes("btn-secondary")
                    ui.button(
                        "Importar", icon="save",
                        on_click=lambda: self._confirm_import(
                            dialog, tmp_path,
                            name_input.value, desc_input.value,
                            cat_select.value, list(selected_tag_ids),
                        ),
                    ).classes("btn-primary")

    def _cancel_import(self, dialog, tmp_path: Path) -> None:
        dialog.close()
        tmp_path.unlink(missing_ok=True)

    def _confirm_import(self, dialog, tmp_path, name, desc, cat_str, tag_ids) -> None:
        name = name.strip() or tmp_path.stem
        category_id = int(cat_str) if cat_str else None
        try:
            schem = file_service.import_schematic(tmp_path, name=name, category_id=category_id)
            if desc.strip():
                with get_session() as session:
                    s = session.get(Schematic, schem.id)
                    if s:
                        s.description = desc.strip()
                        session.add(s)
                        session.commit()
            if tag_ids:
                with get_session() as session:
                    for tid in tag_ids:
                        session.add(SchematicTagLink(schematic_id=schem.id, tag_id=tid))
                    session.commit()
            dialog.close()
            ui.notify(f"✓ {schem.name}  ·  {schem.dimensions}  ·  {schem.block_count:,} bloques",
                      color="positive", position="bottom-right")
            self._load_schematics()
            if self._sidebar:
                self._sidebar.refresh()
        except Exception as exc:
            ui.notify(f"Error al importar: {exc}", color="negative", position="bottom-right")
        finally:
            tmp_path.unlink(missing_ok=True)

    # Handlers ─────────────────────────────────────────────────────────────

    def _on_filter_change(self, category_id: Optional[int], tag_ids: list[int]) -> None:
        self._active_category = category_id
        self._active_tags = tag_ids
        self._selected_ids.clear()
        self._load_schematics()
        self._update_fab()

    def _on_card_select(self, schematic_id: int, selected: bool) -> None:
        if selected:
            self._selected_ids.add(schematic_id)
        else:
            self._selected_ids.discard(schematic_id)
        self._update_fab()

    def _on_card_click(self, schematic_id: int) -> None:
        with get_session() as session:
            schem = session.get(Schematic, schematic_id)
            if schem:
                _ = schem.tags
                open_viewer_dialog(schem, refresh_fn=self._load_schematics)

    def _on_card_delete(self, schematic_id: int) -> None:
        """Elimina el schematic de DB y disco, luego refresca la galería."""
        try:
            file_service.delete_schematic(schematic_id)
            self._selected_ids.discard(schematic_id)
            self._update_fab()
            ui.notify("✓ Schematic eliminado", color="positive", position="bottom-right")
            self._load_schematics()
            if self._sidebar:
                self._sidebar.refresh()
        except Exception as exc:
            ui.notify(f"Error al eliminar: {exc}", color="negative")

    async def _handle_upload(self, e) -> None:
        """Recibe archivo subido y abre el diálogo de importación."""
        tmp = Path(tempfile.mktemp(suffix=".litematic"))
        try:
            await e.file.save(str(tmp))
            self._open_import_dialog(tmp, Path(e.file.name).stem)
        except Exception as exc:
            tmp.unlink(missing_ok=True)
            ui.notify(f"Error al leer archivo: {exc}", color="negative", position="bottom-right")

    async def _import_native(self) -> None:
        if getattr(self, "_is_importing", False):
            return
        self._is_importing = True
        try:
            if not hasattr(app, "native") or not getattr(app.native, "main_window", None):
                ui.notify("Diálogo nativo solo disponible en modo escritorio", color="warning")
                return
            files = await app.native.main_window.create_file_dialog(
                allow_multiple=True,
                file_types=("Litematica files (*.litematic)",),
            )
            if not files:
                return
            for f in files:
                self._open_import_dialog(Path(f), Path(f).stem)
        except Exception as exc:
            ui.notify(f"Error al abrir el diálogo: {exc}", color="warning")
        finally:
            self._is_importing = False

    async def _download_selected(self) -> None:
        if not self._selected_ids:
            return
        try:
            folders = await app.native.main_window.create_file_dialog(
                dialog_type=20, allow_multiple=False,
            )
            if not folders:
                return
            dest = folders[0] if isinstance(folders, (list, tuple)) else folders
            with get_session() as session:
                paths = [session.get(Schematic, sid).file_path
                         for sid in self._selected_ids
                         if session.get(Schematic, sid)]
            copied = file_service.download_selected(paths, dest)
            ui.notify(f"✓ {len(copied)} archivos copiados a {dest}", color="positive", position="bottom-right")
        except Exception as exc:
            ui.notify(f"Error: {exc}", color="negative")
