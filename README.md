# Voltage Workspace

Demo funcional de un workspace de proyectos con tablero Kanban, planificación
Gantt, perfil, preferencias, integraciones y notificaciones persistentes.

## Requisitos

- Python 3.10 o superior
- Node.js 18 o superior
- npm
- Git

## Instalación

Clona el repositorio y entra en la carpeta del proyecto:

```bash
git clone https://github.com/jgarcia-learned-smth/ProyectoProgramacionWeb.git
cd ProyectoProgramacionWeb
```

Instala las dependencias del frontend:

```bash
npm install
```

## Configuración del backend FastAPI

Desde la carpeta `backend-python`:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

La base de datos SQLite, sus tablas y los datos demo se crean automáticamente al
arrancar FastAPI.

Credenciales demo:

```text
Correo: laura@example.com
Contraseña: demo-password
```

## Configuración del frontend

Desde la raíz del proyecto:

```bash
cp .env.example .env.local
```

Para activar el inicio de sesión demo automático, deja estas variables:

```text
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEMO_AUTH=true
VITE_DEMO_EMAIL=laura@example.com
VITE_DEMO_PASSWORD=demo-password
```

No uses `VITE_DEMO_AUTH=true` en producción.

## Iniciar el proyecto

Abre dos terminales.

Terminal 1, backend:

```bash
cd backend-python
source .venv/bin/activate
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

API disponible en `http://localhost:8000`.

Terminal 2, frontend:

```bash
npm run dev
```

Aplicación disponible en `http://localhost:5173`.

Comprobar el backend:

```bash
curl http://localhost:8000/api/health
```

## Funcionalidades

- Autenticación y sesiones con tokens Bearer.
- Workspace persistente con SQLite y Prisma.
- Crear, editar, mover y eliminar tareas.
- Crear, renombrar y eliminar columnas.
- Comentarios y asignación de tareas.
- Perfil y cambio de contraseña.
- Preferencias persistentes.
- Conectar y desconectar integraciones.
- Notificaciones y marcado de lectura.
- Estados de carga, error, vacío y reintento.
- Diseño responsive y navegación por teclado.

## Pruebas y build

Frontend:

```bash
npm run build
```

Backend FastAPI:

```bash
cd backend-python
python -m compileall app.py
```

La documentación interactiva de la API está disponible en
`http://localhost:8000/docs`.

## Estructura principal

```text
src/                  Frontend React/Vite
src/components/       Componentes reutilizables y layout
src/context/          Estado global del workspace
src/frames/           Vistas principales
src/services/         Cliente API y servicios
backend-python/      API FastAPI y SQLite
backend/src/          Implementación Node.js anterior conservada como referencia
backend/prisma/       Esquema de la implementación anterior
```

## Solución de problemas

### No hay conexión con el workspace

Comprueba que el backend esté ejecutándose y que `VITE_API_BASE_URL` apunte a:

```text
http://localhost:8000/api
```

Después recarga la aplicación.

### La base de datos no existe

FastAPI la crea automáticamente. Para reiniciarla, detén el servidor y elimina:

```bash
rm backend-python/voltage.db
```

### Reiniciar los datos locales

El siguiente arranque vuelve a crear las tablas y el seed demo.

```bash
rm backend-python/voltage.db
```
