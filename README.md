# LiteVault

LiteVault is a high-performance web application designed for storing, organizing, and visualizing Minecraft schematics (.litematic files) directly in the browser. 

## Tech Stack
- **Backend**: FastAPI & Python
- **Frontend / UI**: NiceGUI (Vue.js under the hood)
- **Database**: SQLite (SQLModel)
- **3D Rendering Engine**: Vite + `schematic-renderer` + `Nucleation` (WebAssembly/Rust)

## Features
- **Schematic Visualization**: Renders complex `.litematic` files in full 3D within the browser using official Schemat.io packages.
- **Discord Integration**: Sync service to automatically download, tag, and categorize schematics from Discord channels.
- **Auto Tagging**: Infers tags like `#redstone`, `#farm`, `#storage`, based on channel context and schematic name.

## Running Locally

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   .\.venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Ensure the 3D viewer is built (optional if already built in `app/static/viewer3d`):
   ```bash
   cd viewer_src
   npm install
   npm run build
   cd ..
   ```
4. Run the app:
   ```bash
   python app/main.py
   ```
   *The app will be accessible at http://127.0.0.1:8080*

## Notes on 3D Rendering (Resource Pack)
To properly render blocks (including complex redstone states), the `schematic-renderer` requires a valid Minecraft resource pack located at `app/static/viewer3d/pack.zip`.

> [!WARNING]
> If you update `pack.zip` with a custom resource pack (like VanillaTweaks), make sure that texture references in JSON block models use standard string values (`"texture": "path"`). Nested objects (`"texture": {"sprite": "path"}`) are not natively supported by the Nucleation WASM parser and will cause invisible blocks.
