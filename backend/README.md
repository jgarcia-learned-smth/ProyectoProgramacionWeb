# Voltage backend

Backend REST inicial del proyecto Voltage.

## Requisitos

- Node.js 18 o superior
- npm

## Instalación

```bash
npm install
cp .env.example .env
```

## Base de datos

El backend usa SQLite mediante Prisma. Para crear la base de datos, aplicar
migraciones e insertar datos de desarrollo:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

El seed crea el usuario demo `laura@example.com`, un workspace, cuatro
columnas, una tarea, integraciones y una notificación. Es idempotente.

## Ejecución

```bash
npm run dev
```

El servidor queda disponible en `http://localhost:8000`.

## Comprobación

```bash
curl http://localhost:8000/api/health
```

La respuesta debe incluir `"status":"ok"`.

## Autenticación de desarrollo

El seed crea estas credenciales locales:

```text
Correo: laura@example.com
Contraseña: demo-password
```

Iniciar sesión:

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"laura@example.com","password":"demo-password"}'
```

Usa el `token` devuelto como `Authorization: Bearer <token>` para consultar
`GET /api/auth/me` o cerrar sesión con `POST /api/auth/logout`.

## Integración frontend en desarrollo

Para que el frontend inicie automáticamente una sesión demo local, copia las
variables de `.env.example` a `.env.local` y activa:

```text
VITE_DEMO_AUTH=true
VITE_DEMO_EMAIL=laura@example.com
VITE_DEMO_PASSWORD=demo-password
```

La sesión se almacena en `localStorage` y `apiClient` envía el token como
`Authorization: Bearer`. Mantén `VITE_DEMO_AUTH=false` en entornos que no sean
desarrollo local.
