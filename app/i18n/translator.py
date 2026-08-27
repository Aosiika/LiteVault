"""
translator.py — Sistema de Internacionalización (i18n)
"""

import json
from pathlib import Path
from nicegui import app

# Cargar diccionarios en memoria
_I18N_DIR = Path(__file__).parent
_LANGUAGES = {}

def _load_dict(lang_code: str):
    file_path = _I18N_DIR / f"{lang_code}.json"
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            _LANGUAGES[lang_code] = json.load(f)
    else:
        _LANGUAGES[lang_code] = {}

# Cargar diccionarios al arrancar
_load_dict("es")
_load_dict("en")

# Si usamos un ejecutable local/pywebview, app.storage.general funciona muy bien
# para guardar configuraciones persistentes simples en un JSON local oculto.
def set_language(lang_code: str):
    if lang_code in _LANGUAGES:
        app.storage.general['lang'] = lang_code

def get_language() -> str:
    # Por defecto español si no hay preferencia
    return app.storage.general.get('lang', 'es')

def _t(key: str, **kwargs) -> str:
    """Traduce una clave al idioma seleccionado actualmente."""
    lang = get_language()
    dict_lang = _LANGUAGES.get(lang, _LANGUAGES.get("es"))
    
    default_val = kwargs.pop("default", key)
    text = dict_lang.get(key, default_val)
    if kwargs:
        try:
            text = text.format(**kwargs)
        except Exception:
            pass
    return text
