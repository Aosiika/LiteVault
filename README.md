# LiteVault

LiteVault es una aplicación de escritorio de alto rendimiento diseñada para almacenar, organizar y visualizar esquemas de Minecraft (archivos `.litematic`) en un entorno nativo.

## Tecnologías
- **Backend / Core**: FastAPI & Python
- **Interfaz (UI)**: NiceGUI (ejecutado en modo ventana de escritorio nativa)
- **Base de Datos**: SQLite (SQLModel)
- **Motor de Renderizado 3D**: Vite + `schematic-renderer` + `Nucleation` (WebAssembly/Rust)

## Características Principales
- **Visualización 3D Integrada**: Renderiza archivos `.litematic` complejos en 3D interactivo utilizando los paquetes oficiales de Schemat.io adaptados a la aplicación.
- **Integración con Discord**: Servicio de sincronización en segundo plano para descargar automáticamente, etiquetar y clasificar esquemas desde canales de Discord configurados.
- **Auto-Etiquetado Inteligente**: Infiere etiquetas automáticamente (como `#redstone`, `#farm`, `#storage`, etc.) basándose en el contexto del canal y el nombre del esquema.

## Ejecución Local

1. Crea un entorno virtual:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Verifica que el módulo 3D esté construido (opcional si ya existe en `app/static/viewer3d`):
   ```bash
   cd viewer_src
   npm install
   npm run build
   cd ..
   ```
4. Ejecuta la aplicación de escritorio:
   ```bash
   python app/main.py
   ```
   *Se abrirá la interfaz gráfica de LiteVault en una ventana.*

## Notas Técnicas sobre el Visor 3D (Resource Pack)
Para renderizar los bloques correctamente (incluyendo conexiones de redstone complejas y bloques translúcidos), el motor requiere un paquete de texturas de Minecraft válido ubicado en `app/static/viewer3d/pack.zip`.

> [!WARNING]
> Si actualizas el `pack.zip` utilizando paquetes de recursos optimizados (como VanillaTweaks), ten en cuenta que el formato de los modelos JSON debe usar valores de texto convencionales (`"texture": "ruta"`). Los objetos anidados generados por algunos mods o paquetes (`"texture": {"sprite": "ruta"}`) no son soportados de forma nativa por el parser de Nucleation y harán que ciertos bloques (como los polvos de redstone) se vuelvan invisibles si no se corrigen.
