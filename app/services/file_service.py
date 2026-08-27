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
    meta = schematic_service.read_metadata(dest)

    # 3. Generar miniatura 3D real con Nucleation
    thumb_path = thumbnail_service.generate_thumbnail(dest, dest_filename.replace(".litematic", ""))

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
    )

    with get_session() as session:
        schem = Schematic.model_validate(schem_data)
        session.add(schem)
        session.commit()
        session.refresh(schem)
        logger.info("Schematic guardado: id=%d, name=%r", schem.id, schem.name)
        return schem


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
