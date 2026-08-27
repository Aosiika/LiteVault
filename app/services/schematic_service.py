"""
schematic_service.py — Wrapper sobre Nucleation para extraer metadata de .litematic.

Nucleation API (pip install nucleation):
    from nucleation import Schematic
    schem = Schematic.load_from_file("file.litematic")
    info  = schem.get_info()   # dict con dims, block_count, etc.

Si la API exacta difiere entre versiones, el bloque _extract_via_nucleation
intenta múltiples variantes antes de caer al fallback litemapy.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tipos de retorno
# ---------------------------------------------------------------------------

class SchematicMeta:
    """Metadata extraída de un archivo .litematic."""

    def __init__(
        self,
        dimensions: str,
        block_count: int,
        region_count: int = 1,
        author: Optional[str] = None,
        description: Optional[str] = None,
        minecraft_version: Optional[str] = None,
    ):
        self.dimensions = dimensions       # "XxYxZ"
        self.block_count = block_count
        self.region_count = region_count
        self.author = author
        self.description = description
        self.minecraft_version = minecraft_version

    def __repr__(self) -> str:  # noqa: D105
        return (
            f"SchematicMeta(dims={self.dimensions!r}, "
            f"blocks={self.block_count}, regions={self.region_count}, "
            f"version={self.minecraft_version})"
        )

# ---------------------------------------------------------------------------
# Extracción manual de DataVersion con nbtlib
# ---------------------------------------------------------------------------

DATA_VERSIONS = [
    (3955, "1.21.1"), (3953, "1.21"), (3839, "1.20.6"), (3798, "1.20.4"), 
    (3465, "1.20.1"), (3337, "1.19.4"), (3120, "1.19"), (2975, "1.18.2"), 
    (2860, "1.18"), (2730, "1.17.1"), (2586, "1.16.5"), (2566, "1.16"),
    (2230, "1.15.2"), (1976, "1.14.4"), (1628, "1.13.2"), (1343, "1.12.2"),
    (1139, "1.12")
]

def get_minecraft_version(filepath: str) -> str:
    """Lee el NBT comprimido y extrae la versión de Minecraft."""
    try:
        import nbtlib
        nbt_file = nbtlib.load(filepath)
        version_tag = nbt_file.get("MinecraftDataVersion")
        if version_tag is not None:
            dv = int(version_tag)
            for version_id, name in DATA_VERSIONS:
                if dv >= version_id:
                    return name
    except Exception as e:
        logger.debug("No se pudo extraer MinecraftDataVersion de %s: %s", filepath, e)
    return "1.12"



# ---------------------------------------------------------------------------
# Extracción con Nucleation
# ---------------------------------------------------------------------------

def _extract_via_nucleation(filepath: str) -> Optional[SchematicMeta]:
    """
    Extrae metadata usando Nucleation 0.10.x.
    
    API confirmada de nucleation 0.10.14 (todo son métodos, no atributos):
      - schem.dimensions()       → Dimensions con .x, .y, .z
      - schem.tight_dimensions() → Dimensions (bounding box ajustado)
      - schem.block_count()      → int (bloques no-aire)
      - schem.volume()           → int (XxYxZ total)
      - schem.author()           → str
      - schem.description()      → str
    """
    try:
        from nucleation import Schematic as NucSchematic  # type: ignore

        schem = NucSchematic.load_from_file(filepath)

        # Dimensiones ──────────────────────────────────────────────────────
        dims_str = "?x?x?"
        # Preferir tight_dimensions (rango real de bloques) sobre dimensions total
        for method_name in ("tight_dimensions", "dimensions", "allocated_dimensions"):
            if hasattr(schem, method_name):
                try:
                    d = getattr(schem, method_name)()
                    if hasattr(d, "x") and hasattr(d, "y") and hasattr(d, "z"):
                        dims_str = f"{abs(int(d.x))}x{abs(int(d.y))}x{abs(int(d.z))}"
                        break
                except Exception:
                    continue

        # Block count ───────────────────────────────────────────────────────
        bc = 0
        for method_name in ("block_count", "volume"):
            if hasattr(schem, method_name):
                try:
                    val = getattr(schem, method_name)()
                    if isinstance(val, int):
                        bc = val
                        break
                except Exception:
                    continue

        # Author / description ──────────────────────────────────────────────
        author = None
        description = None
        for attr_name in ("author",):
            if hasattr(schem, attr_name):
                try:
                    v = getattr(schem, attr_name)()
                    if isinstance(v, str) and v.strip():
                        author = v.strip()
                except Exception:
                    pass
        for attr_name in ("description",):
            if hasattr(schem, attr_name):
                try:
                    v = getattr(schem, attr_name)()
                    if isinstance(v, str) and v.strip():
                        description = v.strip()
                except Exception:
                    pass

        return SchematicMeta(
            dimensions=dims_str,
            block_count=bc,
            author=author,
            description=description,
        )

    except ImportError:
        logger.warning("nucleation no instalado, usando fallback litemapy")
        return None
    except Exception as exc:
        logger.error("Error al leer con nucleation: %s", exc)
        return None



# ---------------------------------------------------------------------------
# Fallback con litemapy
# ---------------------------------------------------------------------------

def _extract_via_litemapy(filepath: str) -> Optional[SchematicMeta]:
    """Extrae metadata usando litemapy como fallback."""
    try:
        from litemapy import Schematic as LiteSchematic  # type: ignore

        schem = LiteSchematic.load(filepath)
        total_blocks = 0
        max_x = max_y = max_z = 0

        for region in schem.regions.values():
            w = abs(getattr(region, "width", 0))
            h = abs(getattr(region, "height", 0))
            l_ = abs(getattr(region, "length", 0))
            max_x = max(max_x, w)
            max_y = max(max_y, h)
            max_z = max(max_z, l_)
            # Contar bloques no-aire
            for bx in range(w):
                for by in range(h):
                    for bz in range(l_):
                        b = region.getblock(bx, by, bz)
                        if b is not None and getattr(b, "blockstate", b) != "minecraft:air":
                            total_blocks += 1

        return SchematicMeta(
            dimensions=f"{max_x}x{max_y}x{max_z}",
            block_count=total_blocks,
        )
    except ImportError:
        logger.error("litemapy tampoco está instalado. No se puede extraer metadata.")
        return None
    except Exception as exc:
        logger.error("Error con litemapy: %s", exc)
        return None


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

def read_metadata(filepath: str | Path) -> SchematicMeta:
    """
    Lee la metadata de un archivo .litematic.
    
    Orden de intentos:
      1. nucleation  (librería especificada en la spec)
      2. litemapy    (fallback si nucleation no disponible o falla)
      3. SchematicMeta vacío si todo falla

    Args:
        filepath: Ruta al archivo .litematic.

    Returns:
        SchematicMeta con dimensiones y block_count.
    """
    path = str(filepath)
    mc_version = get_minecraft_version(path)

    meta = _extract_via_nucleation(path)
    if meta is not None:
        meta.minecraft_version = mc_version
        logger.info("Metadata leída con nucleation: %s", meta)
        return meta

    meta = _extract_via_litemapy(path)
    if meta is not None:
        meta.minecraft_version = mc_version
        logger.info("Metadata leída con litemapy: %s", meta)
        return meta

    logger.warning("No se pudo extraer metadata de %s — usando valores por defecto", path)
    return SchematicMeta(dimensions="?x?x?", block_count=0, minecraft_version=mc_version)
