"""
models.py — Modelos SQLModel para LiteVault.

Tablas:
  • Category         — árbol de categorías (auto-referencial)
  • Tag              — etiquetas libres
  • Schematic        — archivo .litematic importado
  • SchematicTagLink — relación M:N entre Schematic y Tag
"""

# NOTA: NO usar `from __future__ import annotations` en este archivo.
# SQLModel + SQLAlchemy necesitan evaluar los tipos en tiempo de ejecución
# para las relaciones. El uso de `from __future__ import annotations`
# convierte todas las anotaciones en strings, rompiendo la resolución de clases.

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import Column, ForeignKey, Integer
from sqlalchemy.orm import relationship as sa_relationship
from sqlmodel import Field, Relationship, SQLModel


# ---------------------------------------------------------------------------
# SchematicTagLink  (tabla puente M:N)
# ---------------------------------------------------------------------------

class SchematicTagLink(SQLModel, table=True):
    """Tabla puente many-to-many entre Schematic y Tag."""

    __tablename__ = "schematic_tag_link"

    schematic_id: Optional[int] = Field(
        default=None, foreign_key="schematic.id", primary_key=True
    )
    tag_id: Optional[int] = Field(
        default=None, foreign_key="tag.id", primary_key=True
    )


# ---------------------------------------------------------------------------
# Category  (self-referencial — usa SQLAlchemy relationship directamente)
# ---------------------------------------------------------------------------

class Category(SQLModel, table=True):
    """
    Categoría. Puede tener una categoría padre (subcategorías).
    La relación self-referencial se define con SQLAlchemy directamente
    para evitar conflictos con la resolución de tipos de SQLModel.
    """

    __tablename__ = "category"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1, max_length=120)
    parent_id: Optional[int] = Field(
        sa_column=Column(
            Integer,
            ForeignKey("category.id", ondelete="SET NULL"),
            nullable=True,
            default=None,
        )
    )

    # Relaciones definidas con SQLAlchemy para el self-join
    children: List["Category"] = Relationship(
        sa_relationship=sa_relationship(
            "Category",
            foreign_keys="[Category.parent_id]",
            back_populates="parent",
            lazy="select",
        )
    )
    parent: Optional["Category"] = Relationship(
        sa_relationship=sa_relationship(
            "Category",
            foreign_keys="[Category.parent_id]",
            back_populates="children",
            remote_side="Category.id",
            lazy="select",
        )
    )

    # Schematics en esta categoría
    schematics: List["Schematic"] = Relationship(back_populates="category")


class CategoryCreate(SQLModel):
    name: str
    parent_id: Optional[int] = None


class CategoryRead(SQLModel):
    id: int
    name: str
    parent_id: Optional[int] = None


class CategoryUpdate(SQLModel):
    name: Optional[str] = None
    parent_id: Optional[int] = None


# ---------------------------------------------------------------------------
# Tag
# ---------------------------------------------------------------------------

class Tag(SQLModel, table=True):
    """Etiqueta libre asignable a múltiples schematics."""

    __tablename__ = "tag"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, min_length=1, max_length=60)
    color: Optional[str] = Field(default="#1bd96a", max_length=30)

    schematics: List["Schematic"] = Relationship(
        back_populates="tags", link_model=SchematicTagLink
    )


class TagCreate(SQLModel):
    name: str
    color: Optional[str] = "#1bd96a"


class TagRead(SQLModel):
    id: int
    name: str
    color: Optional[str] = "#1bd96a"


class TagUpdate(SQLModel):
    name: Optional[str] = None
    color: Optional[str] = None


# ---------------------------------------------------------------------------
# Schematic
# ---------------------------------------------------------------------------

class Schematic(SQLModel, table=True):
    """Archivo .litematic importado con su metadata."""

    __tablename__ = "schematic"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None)
    file_path: str = Field(description="Ruta absoluta al archivo .litematic en storage/")
    category_id: Optional[int] = Field(default=None, foreign_key="category.id")
    thumbnail_path: Optional[str] = Field(default=None)
    minecraft_version: Optional[str] = Field(default=None, description="Versión de MC (ej. 1.16)")
    block_count: Optional[int] = Field(default=None)
    dimensions: Optional[str] = Field(
        default=None,
        description="Formato 'XxYxZ', e.g. '64x24x32'",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    category: Optional[Category] = Relationship(back_populates="schematics")
    tags: List[Tag] = Relationship(
        back_populates="schematics", link_model=SchematicTagLink
    )


class SchematicCreate(SQLModel):
    name: str
    description: Optional[str] = None
    file_path: str
    category_id: Optional[int] = None
    thumbnail_path: Optional[str] = None
    block_count: Optional[int] = None
    dimensions: Optional[str] = None
    minecraft_version: Optional[str] = None


class SchematicRead(SQLModel):
    id: int
    name: str
    description: Optional[str] = None
    file_path: str
    category_id: Optional[int] = None
    thumbnail_path: Optional[str] = None
    block_count: Optional[int] = None
    dimensions: Optional[str] = None
    minecraft_version: Optional[str] = None
    created_at: datetime
    tags: List[TagRead] = []
    category: Optional[CategoryRead] = None


class SchematicUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    thumbnail_path: Optional[str] = None
    block_count: Optional[int] = None
    dimensions: Optional[str] = None
