# ¿Imagen o contexto? — Susan Sontag: *Ante el dolor de los demás*

Aplicación web interactiva universitaria desarrollada para una exposición académica basada en el ensayo ***Ante el dolor de los demás*** (*Regarding the Pain of Others*, 2003) de **Susan Sontag**.

---

## 1. Objetivo Académico

La actividad tiene como propósito demostrar en el aula de forma empírica y participativa uno de los argumentos centrales de Susan Sontag:

> **Una fotografía no es un hecho transparente que hable por sí solo.**  
> Toda imagen adquiere significado en función del pie de foto, las palabras que la rodean, el contexto histórico y los conocimientos previos del espectador.

Durante la exposición, los estudiantes observan 3 fotografías históricas en sus teléfonos y eligen entre dos posibles interpretaciones (A o B). El sistema registra sus votos anónimos en una API en tiempo real y el expositor proyecta el impacto de la información sobre la percepción colectiva.

---

## 2. Estructura del Proyecto

```text
ProyectoFilo/
├── index.html              # Pantalla del estudiante (encuesta interactiva y reflexión)
├── admin.html              # Pantalla del expositor (gráficos y estadísticas en vivo)
├── css/
│   └── styles.css          # Estilos modernos, diseño responsive y tema oscuro universitario
├── js/
│   ├── app.js              # Lógica de la actividad del estudiante y conexión con la API
│   └── admin.js            # Lógica de consulta en tiempo real y actualización de barras
├── images/                 # Fotografías históricas locales
│   ├── photo1.jfif         # David Seymour (Chim), Extremadura 1936
│   ├── photo2.jfif         # Dorothea Lange, Migrant Mother 1936
│   └── photo3.jfif         # Archivo Guerra Civil Española
├── api/
│   ├── app.py              # Servidor REST Flask (Endpoints, validación segura y CORS)
│   └── database.py         # Conexión SQLite / PostgreSQL y consultas estadísticas
├── requirements.txt        # Dependencias de Python para el backend
├── README.md               # Documentación completa de uso y despliegue
└── .gitignore              # Exclusiones de control de versiones
```

---

## 3. Tecnologías Utilizadas

- **Frontend**: HTML5 semántico, CSS3 Vanilla (con tokens de diseño, flexbox/grid y micro-animaciones) y JavaScript moderno (ES6+ `fetch`, `async/await`). Tipografías académicas de Google Fonts (*Inter* y *Newsreader*).
- **Backend**: Python 3 con **Flask** y **Flask-CORS** para permitir llamadas seguras desde orígenes cruzados.
- **Servidor de Producción**: **Gunicorn** (preparado para Render).
- **Base de Datos**: **SQLite** para desarrollo local (archivo `api/responses.db` autogenerado) y compatibilidad automática con **PostgreSQL** mediante la variable de entorno `DATABASE_URL` (para Render u otros servicios).

---

## 4. Instalación y Ejecución Local

### Paso 1: Clonar o descargar el proyecto
Abre una terminal en la carpeta raíz del proyecto:
```bash
cd ProyectoFilo
```

### Paso 2: Instalar las dependencias de Python
Asegúrate de tener Python instalado y ejecuta:
```bash
pip install -r requirements.txt
```

### Paso 3: Iniciar el servidor API
Ejecuta:
```bash
python api/app.py
```
Verás un mensaje como:
```text
==========================================
 Servidor iniciado en http://localhost:5000
 Estudiantes: http://localhost:5000/
 Expositor:   http://localhost:5000/admin
==========================================
```

### Paso 4: Abrir la aplicación
- **Vista del Estudiante**: Abre en tu navegador [http://localhost:5000/](http://localhost:5000/) (o abre directamente el archivo `index.html`).
- **Vista del Expositor**: Abre [http://localhost:5000/admin](http://localhost:5000/admin) (o abre directamente `admin.html`).

---

## 5. Arquitectura de Despliegue: GitHub Pages + Render

GitHub Pages sirve el frontend estático (HTML/CSS/JS) y Render ejecuta la API Flask con SQLite.

```
[ Estudiantes / Celulares ]
          │
          ▼
┌─────────────────────────┐
│  GitHub Pages (Frontend) │ ──(POST/GET a la API)─────> ┌────────────────────────┐
│  index.html / admin.html  │                          │   Render.com (API)      │
└─────────────────────────┘                          │      Flask + SQLite     │
                                                         └────────────────────────┘
```

### Paso 1: Subir el proyecto a GitHub
```bash
git init
git add .
git commit -m "Proyecto inicial: Imagen o contexto - Susan Sontag"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/ProyectoFilo.git
git push -u origin main
```

### Paso 2: Publicar la API en Render (Gratis)

> **Archivo `render.yaml` incluido**: Render detecta este archivo automáticamente al conectar el repositorio.

1. Ve a [Render.com](https://render.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **New +** → **Web Service**.
3. Conecta tu repositorio `ProyectoFilo`.
4. Render detectará `render.yaml` automáticamente. Confirma los valores:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --chdir api app:app`
5. Haz clic en **Create Web Service**.
6. Copia la URL que Render te asigna, por ejemplo:
   `https://imagen-o-contexto-api.onrender.com`

### Paso 3: Conectar el Frontend con la API — un único archivo

Abre **solo** `js/config.js` y reemplaza la URL:

```javascript
// ANTES (placeholder):
const API_URL_PRODUCCION = "https://TU-API-AQUI.onrender.com";

// DESPUÉS (con tu URL real de Render):
const API_URL_PRODUCCION = "https://imagen-o-contexto-api.onrender.com";
```

Luego sube el cambio a GitHub:
```bash
git add js/config.js
git commit -m "Configurar URL de la API en producción"
git push
```

### Paso 4: Publicar el Frontend en GitHub Pages
1. En tu repositorio de GitHub, ve a la pestaña **Settings**.
2. En el menú lateral, haz clic en **Pages**.
3. En **Build and deployment** → **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`. Haz clic en **Save**.
5. GitHub Pages publica en: `https://TU-USUARIO.github.io/ProyectoFilo/`

### Paso 5: Proyectar el código QR en clase

El proyecto incluye una página especial de proyección:
- **Local**: [http://localhost:5000/qr.html](http://localhost:5000/qr.html)
- **GitHub Pages**: `https://TU-USUARIO.github.io/ProyectoFilo/qr.html`

Esa página genera el QR automáticamente y permite:
- **Cambiar la URL** en tiempo real desde un panel en pantalla
- **Modo pantalla completa** para el proyector
- **Imprimir** el código QR como respaldo en papel

---

## 6. Endpoints de la API

| Método | Ruta | Descripción | Payload de Ejemplo |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/responses` | Registra la respuesta de un alumno | `{"participant_id": "P-8F42A1", "question": 1, "answer": "B", "response_time": 6.2}` |
| `GET` | `/api/results` | Retorna estadísticas acumuladas | *(Sin parámetros)* |
| `POST` | `/api/admin/reset` | Reinicia la base de datos para una nueva clase | *(Sin parámetros)* |
| `GET` | `/api/health` | Comprobación de estado del servicio | *(Sin parámetros)* |

> **Seguridad y robustez:** La API determina en el servidor si una respuesta es correcta (`CORRECT_ANSWERS`), impidiendo que un estudiante pueda manipular su puntuación desde las herramientas de desarrollador del navegador. Además, no se recopila ningún dato personal (nombre, email ni IP).

---

## 7. Personalización de Imágenes y Preguntas

### Cómo cambiar o sustituir las fotografías
Las fotografías están configuradas en `js/app.js` mediante variables explícitas:

```javascript
const IMAGE_1_URL = "images/photo1.jfif"; // Fotografía 1
const IMAGE_2_URL = "images/photo2.jfif"; // Fotografía 2
const IMAGE_3_URL = "images/photo3.jfif"; // Fotografía 3
```
Puedes reemplazarlas colocando tus propios archivos dentro de la carpeta `images/` o pegando una URL pública segura (ejemplo: enlaces de Wikimedia Commons o repositorios de bibliotecas nacionales).

### Cómo modificar preguntas y opciones
En `js/app.js`, edita el arreglo `QUESTIONS`:
- `prompt`: La pregunta que ven los alumnos.
- `options.A` y `options.B`: El texto de cada opción.
- `explanation`: El texto de contextualización teórica de Susan Sontag que se muestra en la pantalla final.

Si cambias la opción correcta, recuerda actualizar también la constante `CORRECT_ANSWERS` en `api/app.py`:
```python
CORRECT_ANSWERS = {
    1: "B",
    2: "A",
    3: "A"
}
```

---

## 8. Verificación Rápida de Funcionamiento

Para comprobar que las respuestas se están registrando correctamente en la base de datos:

1. Inicia la API con `python api/app.py`.
2. Abre [http://localhost:5000](http://localhost:5000) en una pestaña y responde las 3 preguntas.
3. Abre [http://localhost:5000/admin](http://localhost:5000/admin) en otra pestaña; verás que el número de participantes aumentó a 1 y las barras de porcentajes reflejan inmediatamente tus elecciones.
4. Puedes hacer clic en **"Reiniciar datos"** en la pantalla del expositor para dejar la base de datos en cero antes de que tus compañeros de clase comiencen a votar.
