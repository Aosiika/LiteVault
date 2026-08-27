"""
viewer_webview.py — Panel de detalle del schematic con visor de imagen interactivo y zoom.

Al hacer clic en una tarjeta se abre este diálogo con:
  - Metadatos (nombre, dimensiones, bloques, categoría, tags, descripción)
  - Visor interactivo de alta resolución con zoom (rueda del ratón, botones) y arrastre (pan)
  - Botones de edición rápida de tags/descripción y eliminación
"""

from __future__ import annotations

from pathlib import Path
from typing import Callable, Optional

import json
from nicegui import ui
from sqlmodel import select

from app.db.database import get_session
from app.db.models import Category, Schematic, SchematicTagLink, Tag
from app.services import file_service


def open_viewer_dialog(schematic: Schematic, refresh_fn: Optional[Callable] = None) -> None:
    """
    Abre un diálogo con metadatos + Visor 3D interactivo WebGL (Three.js directo sin iframe).
    
    Args:
        schematic:   El schematic a visualizar.
        refresh_fn:  Callback opcional para refrescar la galería tras editar/borrar.
    """
    from app.main import get_schematic_payload

    # Obtener payload 3D
    payload = None
    error_msg = None
    try:
        payload = get_schematic_payload(schematic.id)
    except Exception as exc:
        error_msg = str(exc)

    with ui.dialog().classes("viewer-dialog") as dialog:
        with ui.card().classes("viewer-dialog-card glass-panel").style("min-width: 92vw; height: 88vh; max-width: 1500px; padding: 0; display: flex; flex-direction: column; overflow: hidden;"):

            # Header ───────────────────────────────────────────────────────
            with ui.row().classes("viewer-header items-center justify-between w-full px-4 py-3 border-b border-[var(--border)]"):
                with ui.row().classes("items-center gap-2"):
                    ui.icon("view_in_ar", size="1.3rem").style("color: var(--accent)")
                    ui.label(schematic.name).classes("viewer-title")
                    if schematic.dimensions:
                        ui.badge(schematic.dimensions).classes("viewer-badge")
                    if schematic.block_count is not None:
                        ui.badge(f"{schematic.block_count:,} bloques").classes("viewer-badge")

                ui.button(icon="close", on_click=dialog.close).classes("btn-ghost-icon")

            # Body: Panel lateral de metadatos + Visor 3D Directo ────────────
            with ui.row().classes("w-full flex-1 gap-0").style("min-height:0; overflow:hidden"):
                with ui.column().classes("viewer-meta-panel gap-3").style("width: 320px; min-width: 320px; overflow-y: auto;"):
                    _render_meta(schematic, dialog, refresh_fn)

                # Visor 3D WebGL Directo (Sin iframe)
                with ui.column().classes("flex-1 h-full relative p-0").style("min-height:0; height:100%; position:relative; overflow:hidden; background:#0a0c12;"):
                    if payload:
                        _render_3d_native_viewer(payload)
                    else:
                        with ui.column().classes("items-center justify-center w-full h-full gap-3 p-8 text-center"):
                            ui.icon("warning", size="3rem").style("color: var(--danger, #ef4444)")
                            ui.label("No se pudo cargar el modelo 3D").style("font-size:1.1rem; font-weight:700; color:#ffffff;")
                            ui.label(error_msg or "Archivo .litematic dañado o formato no compatible.").style("font-size:0.85rem; color:#94a3b8; max-width:400px;")

        if payload:
            safe_payload_json = json.dumps(payload)
            def on_show():
                ui.run_javascript(f"""
                    requestAnimationFrame(() => {{
                        if (window.initSchemViewer) {{
                            window.initSchemViewer("schem-canvas", "viewer3d-container", {safe_payload_json});
                        }}
                    }});
                """)

            def on_hide():
                ui.run_javascript("window.disposeSchemViewer && window.disposeSchemViewer();")

            dialog.on("show", on_show)
            dialog.on("hide", on_hide)

        dialog.open()


def _render_3d_native_viewer(payload: dict) -> None:
    """Renderiza el lienzo WebGL y los controles interactivos en el DOM principal."""
    size_y = payload["size"][1] if payload.get("size") else 1

    # Contenedor del Canvas
    ui.html(
        '<div id="viewer3d-container" style="width:100%; height:100%; position:absolute; inset:0; overflow:hidden;">'
        '  <canvas id="schem-canvas" style="width:100%; height:100%; display:block; outline:none;"></canvas>'
        '</div>'
    )

    # Barra de herramientas superior derecha ─────────────────────────────
    with ui.row().classes("absolute top-3 right-3 gap-1 z-10 p-1 rounded-xl").style("background: rgba(15,17,26,0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08);"):
        ui.button(
            icon="360",
            on_click=lambda: ui.run_javascript("window.toggleSchemAutoRotate && window.toggleSchemAutoRotate();"),
        ).props("flat round dense size=sm").style("color: #cbd5e1;").tooltip("Giro automático (360°)")

        ui.button(
            icon="center_focus_strong",
            on_click=lambda: ui.run_javascript("window.resetSchemCamera && window.resetSchemCamera();"),
        ).props("flat round dense size=sm").style("color: #cbd5e1;").tooltip("Centrar cámara")

    # Controles de Capas (Slicer Y) ───────────────────────────────────────
    with ui.row().classes("absolute bottom-3 left-1/2 -translate-x-1/2 items-center gap-4 z-10 px-4 py-2 rounded-xl").style("background: rgba(15,17,26,0.85); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.08); min-width: 380px; max-width: 90%;"):
        ui.icon("layers", size="1.1rem").style("color: var(--accent)")
        
        with ui.row().classes("items-center gap-2 flex-1"):
            ui.label("Capa Y:").style("font-size:0.75rem; font-weight:600; color:#94a3b8;")
            slider = ui.range(min=0, max=max(0, size_y - 1), value={"min": 0, "max": max(0, size_y - 1)}).props("snap label-always").classes("flex-1")
            
            def _on_slice_change(e):
                val = getattr(e, "value", None) or getattr(e, "args", None) or slider.value
                ymin = val.get("min", 0) if isinstance(val, dict) else 0
                ymax = val.get("max", size_y - 1) if isinstance(val, dict) else size_y - 1
                ui.run_javascript(f"window.setSchemLayerSlice && window.setSchemLayerSlice({ymin}, {ymax});")

            slider.on("update:model-value", _on_slice_change)

    # Guía de controles inferior izquierda ────────────────────────────────
    with ui.row().classes("absolute bottom-3 left-3 items-center gap-1 z-10 px-3 py-1.5 rounded-lg pointer-events-none").style("background: rgba(15,17,26,0.75); border: 1px solid rgba(255,255,255,0.06); font-size: 0.72rem; color: #64748b;"):
        ui.icon("mouse", size="0.9rem").style("color: var(--accent)")
        ui.label("Girar: Clic izq · Mover: Clic dcho · Zoom: Rueda")


def _render_meta(schematic: Schematic, dialog, refresh_fn: Optional[Callable] = None) -> None:
    """Renderiza el panel lateral izquierdo con todos los metadatos editables."""

    # Dimensiones y bloques
    with ui.column().classes("gap-1"):
        with ui.row().classes("items-center gap-2"):
            ui.icon("straighten", size="1rem").style("color: var(--accent)")
            ui.label("Dimensiones").classes("meta-label")
        ui.label(schematic.dimensions or "—").classes("meta-value")

    with ui.column().classes("gap-1"):
        with ui.row().classes("items-center gap-2"):
            ui.icon("view_in_ar", size="1rem").style("color: var(--accent)")
            ui.label("Bloques").classes("meta-label")
        ui.label(f"{schematic.block_count:,}" if schematic.block_count else "—").classes("meta-value")

    # Categoría
    with ui.column().classes("gap-1"):
        with ui.row().classes("items-center gap-2"):
            ui.icon("folder", size="1rem").style("color: var(--accent)")
            ui.label("Categoría").classes("meta-label")
        cat_name = "—"
        if schematic.category_id:
            with get_session() as session:
                cat = session.get(Category, schematic.category_id)
                cat_name = cat.name if cat else "—"
        ui.label(cat_name).classes("meta-value")

    # Tags
    with ui.column().classes("gap-1"):
        with ui.row().classes("items-center gap-2"):
            ui.icon("label", size="1rem").style("color: var(--accent)")
            ui.label("Tags").classes("meta-label")
        if schematic.tags:
            with ui.row().classes("flex-wrap gap-1"):
                for tag in schematic.tags:
                    color = getattr(tag, "color", "#1bd96a") or "#1bd96a"
                    ui.badge(f"#{tag.name}").classes("tag-chip").style(
                        f"background:{color}25; border:1px solid {color}88; color:#ffffff; font-size:0.75rem;"
                    )
        else:
            ui.label("Sin tags").classes("meta-value")

    # Descripción
    if schematic.description:
        with ui.column().classes("gap-1"):
            with ui.row().classes("items-center gap-2"):
                ui.icon("notes", size="1rem").style("color: var(--accent)")
                ui.label("Descripción").classes("meta-label")
            ui.label(schematic.description).classes("meta-value").style(
                "white-space: pre-wrap; word-break: break-word"
            )

    ui.separator().style("border-color: var(--border)")

    # Ruta del archivo
    with ui.column().classes("gap-1"):
        ui.label("Archivo").classes("meta-label")
        ui.label(schematic.file_path.split("\\")[-1]).classes("meta-value-sm")

    ui.separator().style("border-color: var(--border)")

    # Botones
    with ui.column().classes("gap-2 w-full"):
        ui.button(
            "Editar metadatos",
            icon="edit",
            on_click=lambda: _open_edit_dialog(schematic, dialog, refresh_fn),
        ).classes("btn-secondary w-full")

        ui.button(
            "Eliminar",
            icon="delete",
            on_click=lambda: _confirm_delete(schematic, dialog, refresh_fn),
        ).classes("btn-danger w-full")


def _open_edit_dialog(schematic: Schematic, parent_dialog, refresh_fn: Optional[Callable] = None) -> None:
    """Diálogo para editar nombre, descripción, categoría y tags de un schematic existente."""
    with ui.dialog() as edit_dialog:
        edit_dialog.open()
        with ui.card().classes("import-dialog-card"):
            with ui.row().classes("items-center justify-between w-full mb-2"):
                ui.label(f"Editar: {schematic.name}").classes("dialog-title").style("margin:0")
                ui.button(icon="close", on_click=edit_dialog.close).classes("btn-ghost-icon")

            ui.separator().style("border-color: var(--border); margin-bottom:12px")

            name_input = ui.input("Nombre", value=schematic.name).classes("w-full")
            desc_input = ui.textarea(
                "Descripción", value=schematic.description or ""
            ).classes("w-full mt-2").style("min-height:60px")

            # Categoría
            with get_session() as session:
                cats = session.exec(select(Category).order_by(Category.name)).all()
                cur_tags = {link.tag_id for link in session.exec(
                    select(SchematicTagLink).where(SchematicTagLink.schematic_id == schematic.id)
                ).all()}
                all_tags = session.exec(select(Tag).order_by(Tag.name)).all()

            cat_options = {"": "— Sin categoría —"}
            cat_options.update({str(c.id): c.name for c in cats})
            cat_select = ui.select(
                options=cat_options,
                value=str(schematic.category_id) if schematic.category_id else "",
                label="Categoría",
            ).classes("w-full mt-2")

            ui.label("Tags").classes("sidebar-section-title mt-3")
            selected_tags: set[int] = set(cur_tags)
            tag_row = ui.row().classes("flex-wrap gap-1.5 mt-1")

            def _refresh_tags():
                tag_row.clear()
                with tag_row:
                    for tag in all_tags:
                        active = tag.id in selected_tags
                        color = getattr(tag, "color", "#1bd96a") or "#1bd96a"
                        if active:
                            style = f"background: {color}35 !important; border: 1.5px solid {color} !important; color: #ffffff !important; font-weight:700;"
                        else:
                            style = f"background: #1c1e26 !important; border: 1px solid {color}55 !important; color: #cbd5e1 !important;"
                        ui.button(
                            f"#{tag.name}",
                            on_click=lambda _t=tag: _toggle((_t.id)),
                        ).classes("tag-chip").style(style)

            def _toggle(tid: int):
                if tid in selected_tags:
                    selected_tags.discard(tid)
                else:
                    selected_tags.add(tid)
                _refresh_tags()

            _refresh_tags()

            with ui.row().classes("justify-end gap-2 mt-4"):
                ui.button("Cancelar", on_click=edit_dialog.close).classes("btn-secondary")
                ui.button("Guardar", icon="save", on_click=lambda: _save_edit(
                    edit_dialog, schematic.id,
                    name_input.value, desc_input.value,
                    cat_select.value, list(selected_tags),
                    refresh_fn=refresh_fn,
                )).classes("btn-primary")


def _save_edit(
    dialog, schem_id: int, name: str, desc: str, cat_str: str, tag_ids: list[int],
    refresh_fn: Optional[Callable] = None,
) -> None:
    name = name.strip()
    if not name:
        ui.notify("El nombre no puede estar vacío", color="negative")
        return
    with get_session() as session:
        schem = session.get(Schematic, schem_id)
        if not schem:
            return
        schem.name = name
        schem.description = desc.strip() or None
        schem.category_id = int(cat_str) if cat_str else None
        session.add(schem)

        old_links = session.exec(
            select(SchematicTagLink).where(SchematicTagLink.schematic_id == schem_id)
        ).all()
        for lnk in old_links:
            session.delete(lnk)
        for tid in tag_ids:
            session.add(SchematicTagLink(schematic_id=schem_id, tag_id=tid))
        session.commit()

    dialog.close()
    ui.notify("✓ Cambios guardados", color="positive", position="bottom-right")
    if refresh_fn:
        refresh_fn()


def _confirm_delete(
    schematic: Schematic, parent_dialog, refresh_fn: Optional[Callable] = None
) -> None:
    """Muestra confirmación antes de eliminar el schematic."""
    with ui.dialog() as confirm:
        confirm.open()
        with ui.card().classes("dialog-card"):
            ui.label(f"¿Eliminar «{schematic.name}»?").classes("dialog-title")
            ui.label(
                "Se eliminará el archivo .litematic del storage y todos sus datos. "
                "Esta acción no se puede deshacer."
            ).style("color:var(--text-secondary); font-size:0.85rem")
            with ui.row().classes("justify-end gap-2 mt-4"):
                ui.button("Cancelar", on_click=confirm.close).classes("btn-secondary")
                ui.button(
                    "Eliminar",
                    icon="delete",
                    on_click=lambda: _do_delete(confirm, parent_dialog, schematic.id, refresh_fn),
                ).classes("btn-danger-solid")


def _do_delete(confirm_dialog, parent_dialog, schem_id: int, refresh_fn: Optional[Callable]) -> None:
    confirm_dialog.close()
    parent_dialog.close()
    try:
        file_service.delete_schematic(schem_id)
        ui.notify("✓ Schematic eliminado", color="positive", position="bottom-right")
        if refresh_fn:
            refresh_fn()
    except Exception as exc:
        ui.notify(f"Error al eliminar: {exc}", color="negative")
