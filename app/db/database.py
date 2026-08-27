"""
database.py — Engine SQLite y gestión de sesiones para LiteVault.
"""

from __future__ import annotations

from contextlib import contextmanager
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

from app.config import DB_PATH

# ---------------------------------------------------------------------------
# Engine global (SQLite con check_same_thread=False para NiceGUI async)
# ---------------------------------------------------------------------------

DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # Cambiar a True para debug SQL
)


# ---------------------------------------------------------------------------
# Inicialización
# ---------------------------------------------------------------------------

def create_db_and_tables() -> None:
    """Crea todas las tablas si no existen. Llamar al arrancar main.py."""
    # Import de modelos aquí para registrarlos en el metadata de SQLModel
    from app.db import models  # noqa: F401
    from sqlmodel import text
    import sqlite3

    SQLModel.metadata.create_all(engine)
    
    # Migración manual segura: añadir minecraft_version si no existe
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE schematic ADD COLUMN minecraft_version VARCHAR"))
        except Exception as e:
            # Si el error contiene 'duplicate column name', es normal. Lo ignoramos.
            pass

    print(f"[DB] Base de datos lista en: {DB_PATH}")


# ---------------------------------------------------------------------------
# Sesión como context manager
# ---------------------------------------------------------------------------

@contextmanager
def get_session() -> Generator[Session, None, None]:
    """Context manager que provee una sesión de DB y la cierra al salir."""
    with Session(engine) as session:
        yield session


def get_session_direct() -> Session:
    """Retorna una sesión sin context manager. Recordar cerrar manualmente."""
    return Session(engine)
