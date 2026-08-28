<div align="center">
  <img src="app/assets/logo.png" alt="LiteVault Logo" width="128"/>
  <h1>LiteVault</h1>
  <p><strong>El gestor personal y visor 3D definitivo para tus schematics de Litematica.</strong></p>
</div>

<br/>

## ✨ Características

- 📦 **Gestión Local Segura**: Organiza todos tus `.litematic` en categorías personalizadas, con etiquetas y buscador instantáneo.
- 🧊 **Visor 3D Integrado**: Previsualiza tus construcciones directamente en la aplicación gracias al motor *Three.js* y *Litematica-viewer*, sin necesidad de abrir Minecraft.
- 🤖 **Extracción Automática de Metadatos**: Extrae bloques, dimensiones, nombre del autor y fecha de creación de cada schematic automáticamente.
- 💬 **Sincronización con Discord**: Configura un bot para que lea un canal de Discord y se descargue automáticamente los schematics que pasen tus amigos.
- 🎨 **Diseño Moderno**: Interfaz premium estilo "Glassmorphism" con tema oscuro, rápida e intuitiva.
- 🔄 **Actualizaciones Automáticas**: El programa detecta automáticamente las nuevas versiones de GitHub y se actualiza con un solo clic.

---

## 🚀 Instalación y Descarga

Para usuarios normales que solo quieren usar la aplicación:

1. Ve a la pestaña de **[Releases](../../releases/latest)** en la parte derecha de este repositorio.
2. Descarga el último archivo `LiteVault_Setup_vX.X.X.exe`.
3. Ejecútalo, sigue los pasos del instalador y ¡listo!

> **Nota:** La aplicación es portátil dentro de su propia instalación; tu base de datos y tus archivos se guardan de forma segura en tu carpeta personal de documentos.

---

## 🛠️ Entorno de Desarrollo (Código Fuente)

Si eres desarrollador y quieres modificar el código de LiteVault o compilarlo tú mismo:

### 1. Requisitos
- **Python 3.11+**
- **Inno Setup 6** (Solo si quieres generar el `.exe` final)

### 2. Instalación del entorno
Clona el repositorio y crea un entorno virtual:
```bash
git clone https://github.com/Aosiika/LiteVault.git
cd LiteVault
python -m venv .venv
# Activar entorno (Windows)
.venv\Scripts\activate
# Instalar dependencias
pip install -r requirements.txt
```
*(Nota: Actualmente LiteVault utiliza `pyproject.toml` para la gestión de dependencias)*

### 3. Ejecutar en modo desarrollo
```bash
python app/main.py
```

### 4. Compilar el Ejecutable (PyInstaller)
Si has hecho cambios y quieres generar un nuevo `LiteVault.exe`:
```bash
pyinstaller build.spec --clean -y
```

---

## 📚 Tecnologías y Agradecimientos

Este proyecto es de código abierto y ha sido posible gracias al trabajo increíble de la comunidad:

- **[Python](https://www.python.org/)** & **[NiceGUI](https://nicegui.io/)**: Backend y Framework de interfaz gráfica de la aplicación.
- **[SQLite](https://www.sqlite.org/)** & **[SQLModel](https://sqlmodel.tiangolo.com/)**: Base de datos local, ligera y robusta.
- **[maruohon/litematica](https://github.com/maruohon/litematica)**: Creador del formato original `.litematic` para Minecraft.
- **[albertchen857/Litematica-viewer](https://github.com/albertchen857/Litematica-viewer)**: Librería central para desencriptar y parsear los archivos de litematica en JavaScript.
- **[schematic-renderer](https://github.com/vberlier/schematic-renderer)**: Motor de renderizado en web basado en Three.js.

## ⚖️ Aviso Legal (Disclaimer)

**LiteVault es un proyecto de código abierto no comercial.** 
No estamos afiliados, asociados, autorizados, respaldados ni conectados oficialmente de ninguna manera con **Mojang AB** ni con **Microsoft Corporation**. El nombre "Minecraft" y los recursos del juego son marcas registradas de Mojang AB. 

---
<div align="center">
Desarrollado con ❤️ por <b>Aosika</b> | 2026
</div>
