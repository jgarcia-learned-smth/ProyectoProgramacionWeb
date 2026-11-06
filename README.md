# Voltage Workspace

Demo funcional de un workspace de proyectos con tablero Kanban, planificación
Gantt, perfil, preferencias, integraciones y notificaciones persistentes.

## Requisitos

- Node.js 18 o superior
- npm
- Git

## Instalación

Clona el repositorio y entra en la carpeta del proyecto:

```bash
git clone https://github.com/jgarcia-learned-smth/ProyectoProgramacionWeb.git
cd ProyectoProgramacionWeb
```

Instala las dependencias del frontend y backend:

```bash
npm install
cd backend
npm install
```

## Configuración del backend

Desde la carpeta `backend`:

```bash
cp .env.example .env
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

Esto crea la base de datos SQLite local, las tablas y los datos demo.

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
cd backend
npm run dev
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

Backend:

```bash
cd backend
npm test
```

El backend usa `--test-concurrency=1` para evitar que las pruebas interfieran
entre sí al modificar sesiones y datos demo.

## Estructura principal

```text
src/                  Frontend React/Vite
src/components/       Componentes reutilizables y layout
src/context/          Estado global del workspace
src/frames/           Vistas principales
src/services/         Cliente API y servicios
backend/src/          API Express
backend/prisma/       Esquema, migraciones y seed
backend/tests/        Pruebas automatizadas del backend
```

## Solución de problemas

### No hay conexión con el workspace

Comprueba que el backend esté ejecutándose y que `VITE_API_BASE_URL` apunte a:

```text
http://localhost:8000/api
```

Después recarga la aplicación.

### La base de datos no existe

Ejecuta desde `backend`:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

### Reiniciar los datos locales

Para borrar y recrear la base de datos de desarrollo:

```bash
cd backend
npm run db:reset
```

Este comando elimina los datos locales y vuelve a ejecutar el seed.
