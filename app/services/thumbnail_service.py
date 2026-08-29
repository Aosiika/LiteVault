"""
thumbnail_service.py — Generación de miniaturas 3D reales para schematics.

Utiliza el motor de renderizado de Nucleation con el resource pack oficial
de Minecraft (pack.zip) para generar renders isométricos 3D reales de las litemáticas.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from app.config import BASE_DIR, STATIC_DIR, THUMBNAILS_DIR

logger = logging.getLogger(__name__)

# Resource pack singleton en memoria para máxima velocidad de renderizado
_CACHED_RESOURCE_PACK = None


def _get_resource_pack():
    """Carga y cachea el ResourcePack de Minecraft desde el zip oficial."""
    global _CACHED_RESOURCE_PACK
    if _CACHED_RESOURCE_PACK is not None:
        return _CACHED_RESOURCE_PACK

    try:
        import nucleation

        # Buscar en ubicaciones posibles del resource pack
        candidate_paths = [
            STATIC_DIR / "viewer3d" / "pack.zip",
            STATIC_DIR / "viewer" / "pack.zip",
            BASE_DIR / "viewer_src" / "public" / "pack.zip",
            BASE_DIR.parent / "minecraft-default-resource-pack-template-original-26.2.zip",
        ]

        for p in candidate_paths:
            if p.exists():
                logger.info("Cargando resource pack para miniaturas desde: %s", p)
                with open(p, "rb") as f:
                    pack_bytes = f.read()
                _CACHED_RESOURCE_PACK = nucleation.ResourcePack.from_bytes(pack_bytes)
                logger.info(
                    "ResourcePack cargado con éxito: %d texturas, %d modelos",
                    _CACHED_RESOURCE_PACK.texture_count(),
                    _CACHED_RESOURCE_PACK.model_count(),
                )
                return _CACHED_RESOURCE_PACK

        logger.warning("No se encontró pack.zip para el renderizador de miniaturas")
        return None
    except Exception as exc:
        logger.error("Error al inicializar ResourcePack para miniaturas: %s", exc)
        return None


def generate_thumbnail(schematic_path: Path | str, stem: str) -> Optional[Path]:
    """
    Genera un render 3D isométrico real del schematic usando Nucleation y texturas oficiales.
    Si falla, genera el placeholder por defecto.

    Args:
        schematic_path: Ruta al archivo .litematic.
        stem: Nombre base para el thumbnail PNG de salida.

    Returns:
        Path al thumbnail PNG generado.
    """
    out_path = THUMBNAILS_DIR / f"{stem}.png"
    p_schem = Path(schematic_path)

    if not p_schem.exists():
        return generate_placeholder(stem)

    try:
        import nucleation

        rp = _get_resource_pack()
        if rp is None:
            return generate_placeholder(stem)

        with open(p_schem, "rb") as f:
            schem_bytes = f.read()

        schem = nucleation.Schematic.from_litematic(schem_bytes)

        if schem.block_count() == 0:
            logger.info("Schematic %s tiene 0 bloques, generando preview de schematic vacío", p_schem.name)
            return generate_placeholder(stem, label="0 bloques")

        # Configuración de renderizado 3D isométrico en alta resolución para zoom
        cfg = nucleation.RenderConfig.create(800, 600)
        try:
            cfg.set_isometric()
        except Exception:
            pass

        # Renderizar directamente al archivo PNG de salida temporal
        png_path = THUMBNAILS_DIR / f"{stem}.png"
        nucleation.Renderer.render_to_file_with_pack(schem, rp, cfg, str(png_path))

        if png_path.exists() and png_path.stat().st_size > 0:
            # Convertir a WebP para ahorrar espacio y memoria
            try:
                from PIL import Image
                out_path = THUMBNAILS_DIR / f"{stem}.webp"
                with Image.open(png_path) as img:
                    img.save(out_path, "WEBP", quality=85)
                png_path.unlink() # Borrar PNG original
                
                logger.info("Miniatura 3D real WebP generada: %s (%d bytes)", out_path, out_path.stat().st_size)
                return out_path
            except Exception as e:
                logger.warning("Fallo al convertir miniatura a WebP: %s", e)
                return png_path # Devolver PNG si falla la conversión
    except Exception as exc:
        logger.warning("Fallo al generar miniatura 3D con Nucleation (%s), usando placeholder: %s", p_schem.name, exc)

    return generate_placeholder(stem)


# ---------------------------------------------------------------------------
# Placeholder de respaldo (en caso de error de parseo o esquemas vacíos)
# ---------------------------------------------------------------------------

def generate_placeholder(stem: str, label: str = ".litematic") -> Optional[Path]:
    """Genera un PNG placeholder en caso de fallo del renderizador."""
    try:
        from PIL import Image, ImageDraw, ImageFont

        w, h = 360, 240
        img = Image.new("RGB", (w, h), (18, 18, 24))
        draw = ImageDraw.Draw(img)

        # Grid sutil
        for gx in range(0, w, 20):
            draw.line([(gx, 0), (gx, h)], fill=(28, 28, 38))
        for gy in range(0, h, 20):
            draw.line([(0, gy), (w, gy)], fill=(28, 28, 38))

        # Cubo isométrico centrado
        cx, cy, s = w // 2, h // 2 - 10, 45
        top = [(cx, cy - s), (cx + s, cy - s // 2), (cx, cy), (cx - s, cy - s // 2)]
        left = [(cx - s, cy - s // 2), (cx, cy), (cx, cy + s), (cx - s, cy + s // 2)]
        right = [(cx, cy), (cx + s, cy - s // 2), (cx + s, cy + s // 2), (cx, cy + s)]

        draw.polygon(top, fill=(100, 70, 210), outline=(124, 58, 237))
        draw.polygon(left, fill=(60, 30, 140), outline=(124, 58, 237))
        draw.polygon(right, fill=(80, 45, 175), outline=(124, 58, 237))

        try:
            font = ImageFont.truetype("arial.ttf", 12)
        except Exception:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), label, font=font)
        tx = (w - (bbox[2] - bbox[0])) // 2
        draw.text((tx, h - 28), label, fill=(180, 180, 200), font=font)

        out_path = THUMBNAILS_DIR / f"{stem}.webp"
        img.save(out_path, "WEBP", quality=85)
        return out_path
    except Exception as exc:
        logger.error("Error generando placeholder: %s", exc)
        return None
