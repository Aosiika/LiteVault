"""
file_service.py — Importación y exportación de archivos .litematic.
"""

from __future__ import annotations

import logging
import shutil
import uuid
from pathlib import Path
from typing import Optional

from app.config import SCHEMATICS_DIR
from app.db.database import get_session
from app.db.models import Schematic, SchematicCreate
from app.services import schematic_service
from app.services import thumbnail_service

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Importación
# ---------------------------------------------------------------------------

def import_schematic(
    src_path: str | Path,
    name: Optional[str] = None,
    category_id: Optional[int] = None,
) -> Schematic:
    """
    Importa un archivo .litematic a la colección.

    Pasos:
      1. Copia el archivo a storage/schematics/<uuid>.litematic
      2. Extrae metadata con Nucleation (dimensiones, block_count)
      3. Genera thumbnail placeholder
      4. Persiste el Schematic en la DB

    Args:
        src_path: Ruta al archivo .litematic de origen.
        name: Nombre a mostrar. Si None, usa el nombre del archivo.
        category_id: ID de la categoría. Opcional.

    Returns:
        El objeto Schematic recién creado en la DB.
    """
    src = Path(src_path).resolve()
    if not src.exists():
        raise FileNotFoundError(f"Archivo no encontrado: {src}")
    if src.suffix.lower() != ".litematic":
        raise ValueError(f"No es un archivo .litematic: {src.name}")

    # 1. Copiar a storage
    dest_filename = f"{uuid.uuid4().hex}.litematic"
    dest = SCHEMATICS_DIR / dest_filename
    shutil.copy2(src, dest)
    logger.info("Copiado %s → %s", src.name, dest)

    # 2. Extraer metadata
    try:
        meta = schematic_service.read_metadata(dest)

        # 3. Generar miniatura placeholder muy rápido para la interfaz inmediata
        stem = dest_filename.replace(".litematic", "")
        thumb_path = thumbnail_service.generate_placeholder(stem)

        # 4. Persistir en DB
        display_name = name or src.stem
        schem_data = SchematicCreate(
            name=display_name,
            file_path=str(dest),
            category_id=category_id,
            thumbnail_path=str(thumb_path) if thumb_path else None,
            block_count=meta.block_count,
            dimensions=meta.dimensions,
            description=meta.description,
            minecraft_version=meta.minecraft_version,
        )

        with get_session() as session:
            schem = Schematic.model_validate(schem_data)
            session.add(schem)
            session.commit()
            session.refresh(schem)
            logger.info("Schematic guardado: id=%d, name=%r", schem.id, schem.name)
            
            # 5. Lanzar generación del render 3D real en segundo plano
            import threading
            def _background_thumbnail(schem_id: int, p_dest: Path, p_stem: str):
                try:
                    real_thumb = thumbnail_service.generate_thumbnail(p_dest, p_stem)
                    if real_thumb and str(real_thumb) != str(thumb_path):
                        with get_session() as s:
                            db_s = s.get(Schematic, schem_id)
                            if db_s:
                                db_s.thumbnail_path = str(real_thumb)
                                s.add(db_s)
                                s.commit()
                except Exception as e:
                    logger.error("Error en render 3D de fondo: %s", e)

            threading.Thread(target=_background_thumbnail, args=(schem.id, dest, stem), daemon=True).start()

            return schem
    except Exception as e:
        # Limpiar el archivo copiado si falla la lectura de NBT o DB
        dest.unlink(missing_ok=True)
        logger.error("Fallo al importar schematic %s: %s", src.name, e)
        raise e


# ---------------------------------------------------------------------------
# Exportación / descarga
# ---------------------------------------------------------------------------

def download_selected(
    file_paths: list[str],
    dest_folder: str | Path,
) -> list[Path]:
    """
    Copia los archivos .litematic seleccionados a una carpeta de destino.

    Args:
        file_paths: Lista de rutas absolutas a los archivos en storage/.
        dest_folder: Carpeta de destino elegida por el usuario.

    Returns:
        Lista de paths de los archivos copiados.
    """
    dest = Path(dest_folder).resolve()
    dest.mkdir(parents=True, exist_ok=True)

    copied: list[Path] = []
    for fp in file_paths:
        src = Path(fp)
        if not src.exists():
            logger.warning("Archivo no encontrado al descargar: %s", fp)
            continue
        target = dest / src.name
        # Si ya existe, añadir sufijo para no sobreescribir
        if target.exists():
            target = dest / f"{src.stem}_{uuid.uuid4().hex[:6]}{src.suffix}"
        shutil.copy2(src, target)
        copied.append(target)
        logger.info("Descargado → %s", target)

    return copied


# ---------------------------------------------------------------------------
# Eliminación
# ---------------------------------------------------------------------------

def delete_schematic_files(file_path: str, thumbnail_path: Optional[str] = None) -> None:
    """Elimina los archivos físicos de un schematic del storage."""
    for path_str in filter(None, [file_path, thumbnail_path]):
        p = Path(path_str)
        if p.exists():
            p.unlink()
            logger.info("Eliminado: %s", p)


def delete_schematic(schematic_id: int) -> None:
    """
    Elimina un schematic de la DB y sus archivos del storage.

    Args:
        schematic_id: ID del schematic a eliminar.

    Raises:
        ValueError: Si no se encuentra el schematic.
    """
    from app.db.models import SchematicTagLink
    from sqlmodel import select

    with get_session() as session:
        schem = session.get(Schematic, schematic_id)
        if not schem:
            raise ValueError(f"Schematic {schematic_id} no encontrado")

        file_path = schem.file_path
        thumb_path = schem.thumbnail_path

        # Borrar links de tags primero (FK)
        links = session.exec(
            select(SchematicTagLink).where(SchematicTagLink.schematic_id == schematic_id)
        ).all()
        for link in links:
            session.delete(link)

        session.delete(schem)
        session.commit()
        logger.info("Schematic id=%d eliminado de DB", schematic_id)

    # Borrar archivos físicos
    delete_schematic_files(file_path, thumb_path)

def delete_category_hierarchy(category_id: int) -> None:
    """Elimina recursivamente una categoría, todas sus subcategorías y sus litemáticas (archivos físicos incluidos)."""
    from app.db.models import Category
    from sqlmodel import select
    
    with get_session() as session:
        cat_ids = [category_id]
        to_check = [category_id]
        while to_check:
            current = to_check.pop(0)
            children = session.exec(select(Category.id).where(Category.parent_id == current)).all()
            cat_ids.extend(children)
            to_check.extend(children)
            
        schematics = session.exec(select(Schematic.id).where(Schematic.category_id.in_(cat_ids))).all()
        
    for s_id in schematics:
        try:
            delete_schematic(s_id)
        except Exception as e:
            logger.warning(f"Error borrando schematic {s_id}: {e}")
            
    with get_session() as session:
        for cid in reversed(cat_ids):
            c = session.get(Category, cid)
            if c:
                session.delete(c)
        session.commit()

