"""
viewer.py — Página/función del visor 3D.

La apertura del viewer se hace con open_viewer_dialog() desde home.py.
Este módulo re-exporta esa función para mantener la estructura de paquetes
tal como se especificó.
"""

from app.ui.components.viewer_webview import open_viewer_dialog  # noqa: F401

__all__ = ["open_viewer_dialog"]
