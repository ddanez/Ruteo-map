# Guía para Generar el APK con GitHub Actions

Este proyecto ya incluye **Capacitor** y el flujo de trabajo automatizado de **GitHub Actions** (`.github/workflows/build-apk.yml`) para compilar tu aplicación en un archivo `.apk` instalable en Android.

---

## Pasos para generar y descargar tu APK

### Paso 1: Exportar el proyecto a tu cuenta de GitHub
1. En la esquina superior derecha de Google AI Studio, abre el menú de opciones (icono de tres puntos o rueda de configuración).
2. Haz clic en **"Export to GitHub"** (o conecta tu cuenta de GitHub para crear un nuevo repositorio).
3. Selecciona tu cuenta y crea el repositorio (por ejemplo: `rastreador-rutas`).

---

### Paso 2: Ejecutar el Workflow de Compilación
Una vez exportado a tu repositorio en GitHub:
1. Entra a tu repositorio en GitHub desde tu navegador o móvil: `https://github.com/tu-usuario/rastreador-rutas`.
2. Ve a la pestaña **Actions** (en la barra superior del repositorio).
3. En la columna izquierda, selecciona **"Build Android APK"**.
4. Haz clic en el botón desplegable **"Run workflow"** y luego en el botón verde **"Run workflow"** (también se ejecuta automáticamente con cada *push*).
5. Espera unos 3-5 minutos mientras GitHub prepara el entorno de Android y compila el APK.

---

### Paso 3: Descargar e Instalar en tu Móvil Android
1. Cuando el flujo termine con una marca verde (✓), haz clic sobre la ejecución completada (ej. *"Compilar APK Android"*).
2. Baja hasta la sección **Artifacts** (al final de la página del resumen).
3. Haz clic sobre **`RutasYParadas-APK`**. Se descargará un archivo `.zip`.
4. Descomprímelo en tu móvil o PC: dentro encontrarás el archivo **`app-debug.apk`**.
5. Abre el archivo en tu teléfono Android y pulsa **"Instalar"** (si tu teléfono te lo solicita, autoriza "Instalar apps de fuentes desconocidas" en los ajustes del navegador o gestor de archivos).

---

## Permisos incluidos en el APK
El workflow ya configura automáticamente en el `AndroidManifest.xml`:
- **GPS de Alta Precisión (`ACCESS_FINE_LOCATION`)**: Para registrar el camino y la velocidad en vivo.
- **Cámara (`CAMERA`) y Almacenamiento**: Para tomar o adjuntar fotos a tus paradas.
- **Internet (`INTERNET`)**: Para cargar los mapas abiertos de OpenStreetMap.
