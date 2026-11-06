# Voltage API en FastAPI

Implementación Python del backend de Voltage. Conserva el contrato `/api`
usado por el frontend React y utiliza FastAPI, SQLite y bcrypt.

## Requisitos

- Python 3.10 o superior

## Instalación

```bash
cd backend-python
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

La base SQLite se crea y se inicializa automáticamente al arrancar. El usuario
demo es `laura@example.com` con contraseña `demo-password`.

## Ejecución

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

La API queda disponible en `http://localhost:8000`. La documentación interactiva
se encuentra en `http://localhost:8000/docs`.

## Comprobación

```bash
curl http://localhost:8000/api/health
```

La respuesta debe incluir `"status":"ok"`.
