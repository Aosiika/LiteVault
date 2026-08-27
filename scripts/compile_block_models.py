# scripts/compile_block_models.py
import json
import zipfile
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent.parent
PACK_ZIP = WORKSPACE_ROOT / "minecraft-default-resource-pack-template-original-26.2.zip"
OUT_JSON = Path(__file__).resolve().parent.parent / "app" / "static" / "viewer3d" / "block_models.json"

def compile_all_block_models():
    if not PACK_ZIP.exists():
        print(f"[models] AVISO: No se encontro el archivo zip en: {PACK_ZIP}")
        return 0

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    raw_models = {}

    with zipfile.ZipFile(PACK_ZIP, 'r') as z:
        for file_info in z.infolist():
            if file_info.filename.startswith("assets/minecraft/models/block/") and file_info.filename.endswith(".json"):
                model_name = Path(file_info.filename).stem
                try:
                    with z.open(file_info) as f:
                        data = json.load(f)
                        raw_models[model_name] = data
                except Exception:
                    pass

    def resolve_model(name, depth=0):
        if depth > 10 or name not in raw_models:
            return None
        data = raw_models[name]
        textures = dict(data.get("textures", {}))
        elements = data.get("elements", None)

        if "parent" in data:
            parent_name = data["parent"].replace("minecraft:block/", "").replace("block/", "")
            parent_res = resolve_model(parent_name, depth + 1)
            if parent_res:
                parent_textures, parent_elements = parent_res
                merged_textures = dict(parent_textures)
                merged_textures.update(textures)
                textures = merged_textures
                if elements is None:
                    elements = parent_elements

        return textures, elements

    def resolve_tex_variable(var_name, tex_dict, depth=0):
        if depth > 10:
            return "stone"
        val = str(var_name)
        if isinstance(var_name, dict):
            for k in ["sprite", "texture", "block", "name"]:
                if k in var_name:
                    val = str(var_name[k])
                    break
            else:
                val = "stone"

        if val.startswith("#"):
            ref = val[1:]
            if ref in tex_dict:
                return resolve_tex_variable(tex_dict[ref], tex_dict, depth + 1)
            return "stone"

        val = val.replace("minecraft:block/", "").replace("block/", "").replace("minecraft:", "")
        return val

    compiled = {}

    for name in raw_models.keys():
        res = resolve_model(name)
        if not res:
            continue
        textures, elements = res
        if not elements:
            continue

        compiled_elements = []
        for elem in elements:
            from_pt = elem.get("from", [0, 0, 0])
            to_pt = elem.get("to", [16, 16, 16])
            faces = elem.get("faces", {})

            compiled_faces = {}
            for dir_name, face_data in faces.items():
                raw_tex = face_data.get("texture", "stone")
                actual_tex = resolve_tex_variable(raw_tex, textures)
                uv = face_data.get("uv", [0, 0, 16, 16])
                compiled_faces[dir_name] = {
                    "texture": actual_tex,
                    "uv": uv,
                    "tint": face_data.get("tintindex", None),
                    "rotation": face_data.get("rotation", 0)
                }

            compiled_elements.append({
                "from": from_pt,
                "to": to_pt,
                "faces": compiled_faces
            })

        if compiled_elements:
            compiled[name] = compiled_elements

    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(compiled, f, separators=(',', ':'))

    size_kb = OUT_JSON.stat().st_size / 1024
    print(f"[models] OK: Compilados {len(compiled)} modelos 3D oficiales en {OUT_JSON} ({size_kb:.1f} KB)")
    return len(compiled)

if __name__ == "__main__":
    compile_all_block_models()
