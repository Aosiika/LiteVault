# scripts/extract_texturepack.py
import shutil
import zipfile
from pathlib import Path
from PIL import Image

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
PACK_ZIP = WORKSPACE_ROOT / "minecraft-default-resource-pack-template-original-26.2.zip"
DEST_DIR = Path(__file__).resolve().parent.parent / "app" / "static" / "textures" / "block"

def extract_block_textures():
    if not PACK_ZIP.exists():
        print(f"[textures] AVISO: No se encontro el archivo zip en: {PACK_ZIP}")
        return 0

    DEST_DIR.mkdir(parents=True, exist_ok=True)

    extracted_count = 0
    with zipfile.ZipFile(PACK_ZIP, 'r') as z:
        for file_info in z.infolist():
            if file_info.filename.startswith("assets/minecraft/textures/block/") and file_info.filename.endswith(".png"):
                filename = Path(file_info.filename).name
                dest_file = DEST_DIR / filename
                with z.open(file_info) as src, open(dest_file, "wb") as dst:
                    shutil.copyfileobj(src, dst)
                extracted_count += 1

        # Texturas de cofres
        for chest_type, prefix in [
            ("normal", "chest"),
            ("trapped", "trapped_chest"),
            ("ender", "ender_chest"),
        ]:
            chest_path = f"assets/minecraft/textures/entity/chest/{chest_type}.png"
            if chest_path in z.namelist():
                with z.open(chest_path) as src:
                    img = Image.open(src).convert("RGBA")
                    top = img.crop((14, 0, 28, 14)).resize((16, 16), Image.NEAREST)
                    top.save(DEST_DIR / f"{prefix}_top.png")

                    bottom = img.crop((28, 19, 42, 33)).resize((16, 16), Image.NEAREST)
                    bottom.save(DEST_DIR / f"{prefix}_bottom.png")

                    side = img.crop((0, 29, 14, 43)).resize((16, 16), Image.NEAREST)
                    side.save(DEST_DIR / f"{prefix}_side.png")

                    front = img.crop((42, 29, 56, 43)).resize((14, 14), Image.NEAREST)
                    latch = img.crop((1, 1, 3, 5)).resize((2, 4), Image.NEAREST)
                    front_bg = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
                    front_bg.paste(front, (1, 1))
                    front = front_bg
                    front.paste(latch, (7, 5))
                    front = front.resize((16, 16), Image.NEAREST)
                    front.save(DEST_DIR / f"{prefix}_front.png")
            
            # Generar redstone_dust_cross.png compuesto
            line0_path = DEST_DIR / "redstone_dust_line0.png"
            if line0_path.exists():
                line0 = Image.open(line0_path).convert("RGBA")
                cross = Image.alpha_composite(line0, line0.rotate(90))
                cross.save(DEST_DIR / "redstone_dust_cross.png")

    print(f"[textures] OK: Extraidas {extracted_count} texturas oficiales en {DEST_DIR}")
    return extracted_count

if __name__ == "__main__":
    extract_block_textures()
