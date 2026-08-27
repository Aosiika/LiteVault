import sqlite3
import sys
from pathlib import Path

# Añadir raíz de litevault al path
root_dir = Path(__file__).resolve().parent.parent.parent.parent.parent.parent / "Documents" / "mine-litematica-storage" / "litevault"
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

from app.config import DB_PATH
from app.db.database import get_session, create_db_and_tables
from app.db.models import Category, Tag
from sqlmodel import select

create_db_and_tables()

# Migración de SQLite
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("PRAGMA table_info(tag)")
columns = [col[1] for col in cursor.fetchall()]
if "color" not in columns:
    cursor.execute("ALTER TABLE tag ADD COLUMN color TEXT DEFAULT '#1bd96a'")
    conn.commit()
conn.close()

STRUCTURE = {
    "MONSTERS": [
        "overworld-monsters",
        "slime",
        "nether-monsters",
        "gold-and-bartering",
        "fortress-monsters",
        "end-monsters",
    ],
    "CREATURES": [
        "villagers",
        "iron",
        "animals",
        "bees",
        "aquatic-creatures",
    ],
    "AGRICULTURE": [
        "trees-and-leaves",
        "mushrooms-and-fungi",
        "moss-and-aquatic-plants",
        "tall-plants",
        "crops",
        "flowers-and-grasses",
    ],
    "BLOCKS & ITEMS": [
        "stones",
        "gravity-blocks",
        "block-converters",
        "obsidian-and-lava",
        "snow-and-ice",
        "item-dupers",
        "dirts",
    ],
    "ITEM PROCESSING": [
        "storage-systems",
        "furnace-arrays",
        "potion-brewers",
        "crafting",
    ],
    "INFRASTRUCTURE": [
        "chunk-loaders",
        "mob-switches",
        "infrastructure",
        "terrain-clearing",
        "entity-transport",
    ],
    "NICHE & LEGACY": [
        "what-is-niche-and-legacy",
        "niche-monsters",
        "niche-creatures",
        "niche-agriculture",
        "niche-blocks-and-items",
        "niche-item-processing",
        "niche-infrastructure",
    ],
}

TAGS = [
    ("redstone", "#ef4444"),
    ("farm", "#22c55e"),
    ("storage", "#f59e0b"),
    ("automated", "#3b82f6"),
    ("compact", "#84cc16"),
    ("survival-friendly", "#14b8a6"),
    ("nether", "#e11d48"),
    ("end", "#a855f7"),
    ("overworld", "#10b981"),
    ("villager", "#d97706"),
    ("iron", "#94a3b8"),
    ("xp", "#86efac"),
    ("furnace", "#f97316"),
    ("flying-machine", "#06b6d4"),
    ("glitch-duper", "#ec4899"),
    ("decoration", "#fbbf24"),
    ("quarry-world-eater", "#dc2626"),
    ("potion", "#c084fc"),
]

with get_session() as session:
    # Crear categorías
    for root_name, subs in STRUCTURE.items():
        root = session.exec(select(Category).where(Category.name == root_name, Category.parent_id == None)).first()
        if not root:
            root = Category(name=root_name, parent_id=None)
            session.add(root)
            session.commit()
            session.refresh(root)
            print(f"Root category: {root_name}")
        
        for sub_name in subs:
            sub = session.exec(select(Category).where(Category.name == sub_name, Category.parent_id == root.id)).first()
            if not sub:
                sub = Category(name=sub_name, parent_id=root.id)
                session.add(sub)
                session.commit()
                print(f"  -> Subcategory: {sub_name}")

    # Crear / actualizar tags
    for tag_name, tag_color in TAGS:
        t = session.exec(select(Tag).where(Tag.name == tag_name)).first()
        if not t:
            t = Tag(name=tag_name, color=tag_color)
            session.add(t)
            print(f"Tag created: #{tag_name} ({tag_color})")
        else:
            t.color = tag_color
            session.add(t)
            print(f"Tag updated: #{tag_name} ({tag_color})")
    session.commit()

print("All categories and colored tags seeded successfully!")
