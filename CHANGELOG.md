# ?? LiteVault Changelog

## [1.1.0] - 2026-08-29

### ?? Novedades (Nuevas Características)
- **Edición Masiva:** Menú flotante para borrar o asignar categorías a múltiples tarjetas a la vez.
- **Drag & Drop:** Ahora puedes arrastrar tarjetas y soltarlas directamente en las categorías del menú lateral para moverlas y organizarlas rápidamente.
- **Dimensiones Reales:** La interfaz ya lee de forma nativa los archivos y muestra el tamaño exacto (ej. 15x10x15) de las construcciones importadas basándose en sus metadatos.

### ?? Correcciones (Bug Fixes)
- **Reinicio Automático (Anti-Seguridad PyInstaller):** Arreglado definitivamente el temido bug de "Security validation failure" (y derivados como el WinError 87) que bloqueaba la app tras actualizar. Se ha implementado un nuevo motor de instalación intermedia (script desvinculado) que purga el entorno, actualiza de forma 100% invisible en segundo plano, y relanza el juego limpio como la seda. A partir de esta versión, actualizar es pulsar un botón y relajarse.

> **Nota para usuarios de la v1.0.0:** La actualización desde dentro de la app fallará. Deberás descargar este parche a mano. A partir de esta **v1.1.0**, todas las futuras actualizaciones volverán a ser 100% automáticas y silenciosas.
