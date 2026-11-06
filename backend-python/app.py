from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import bcrypt
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(BASE_DIR / "voltage.db")))
SESSION_TTL_HOURS = int(os.getenv("SESSION_TTL_HOURS", "24"))


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@contextmanager
def db():
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def init_db() -> None:
    with db() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'Miembro'
            );
            CREATE TABLE IF NOT EXISTS sessions (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT UNIQUE NOT NULL,
              expires_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS workspaces (
              id TEXT PRIMARY KEY, name TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS workspace_members (
              user_id TEXT NOT NULL, workspace_id TEXT NOT NULL, role TEXT NOT NULL,
              joined_at TEXT NOT NULL, PRIMARY KEY(user_id, workspace_id),
              FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS columns (
              id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, title TEXT NOT NULL,
              color TEXT NOT NULL, position INTEGER NOT NULL,
              FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS tasks (
              id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, column_id TEXT NOT NULL,
              title TEXT NOT NULL, description TEXT NOT NULL, tag TEXT NOT NULL,
              priority TEXT NOT NULL, assignee_id TEXT, estimate TEXT NOT NULL,
              date TEXT, position INTEGER NOT NULL, attachment TEXT,
              FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
              FOREIGN KEY(column_id) REFERENCES columns(id) ON DELETE CASCADE,
              FOREIGN KEY(assignee_id) REFERENCES users(id) ON DELETE SET NULL
            );
            CREATE TABLE IF NOT EXISTS comments (
              id TEXT PRIMARY KEY, task_id TEXT NOT NULL, author_id TEXT,
              author TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS preferences (
              user_id TEXT PRIMARY KEY, locale TEXT NOT NULL, timezone TEXT NOT NULL,
              notifications INTEGER NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS integrations (
              id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, name TEXT NOT NULL,
              description TEXT NOT NULL, connected INTEGER NOT NULL DEFAULT 0,
              connected_at TEXT, UNIQUE(workspace_id, name),
              FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS notifications (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, workspace_id TEXT NOT NULL,
              title TEXT NOT NULL, detail TEXT NOT NULL, read_at TEXT, created_at TEXT NOT NULL,
              FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
              FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );
            """
        )
        if connection.execute("SELECT 1 FROM users LIMIT 1").fetchone():
            return
        user_id, workspace_id = "demo-user", "workspace-product-voltage"
        password = bcrypt.hashpw(b"demo-password", bcrypt.gensalt()).decode()
        connection.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", (user_id, "Laura C.", "laura@example.com", password, "Administrador"))
        connection.execute("INSERT INTO workspaces VALUES (?, ?)", (workspace_id, "Product voltage"))
        connection.execute("INSERT INTO workspace_members VALUES (?, ?, ?, ?)", (user_id, workspace_id, "owner", now()))
        columns = [("backlog", "Backlog", "#D8D5CB"), ("in-progress", "En curso", "#F5DC6A"), ("review", "Revisión", "#CBE5D8"), ("done", "Completado", "#CAD8EA")]
        for position, (column_id, title, color) in enumerate(columns):
            connection.execute("INSERT INTO columns VALUES (?, ?, ?, ?, ?)", (column_id, workspace_id, title, color, position))
        connection.execute("INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", (
            "demo-task", workspace_id, "in-progress", "Refinar tokens de diseño",
            "Revisar el sistema de tokens del producto.", "Producto", "Alta", user_id, "5 pts", "25 JUN", 0, None,
        ))
        connection.execute("INSERT INTO preferences VALUES (?, ?, ?, ?)", (user_id, "es", "America/Caracas", 1))
        for integration_id, name, description in [("slack", "Slack", "Mensajería del equipo"), ("trello", "Trello", "Gestión visual de tareas")]:
            connection.execute("INSERT INTO integrations VALUES (?, ?, ?, ?, ?, ?)", (integration_id, workspace_id, name, description, 0, None))
        connection.execute("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)", ("demo-notification", user_id, workspace_id, "Bienvenido a Voltage", "Tu workspace está listo.", None, now()))


def error(code: str, message: str, status: int) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


def user_json(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": row["id"], "name": row["name"], "email": row["email"], "role": row["role"]}


def initials(name: str | None) -> str | None:
    return "".join(part[0] for part in (name or "").split())[:2].upper() or None


def task_json(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    assignee = connection.execute("SELECT name FROM users WHERE id = ?", (row["assignee_id"],)).fetchone() if row["assignee_id"] else None
    comments = connection.execute("SELECT id, author, text, created_at AS createdAt FROM comments WHERE task_id = ? ORDER BY created_at", (row["id"],)).fetchall()
    result = dict(row)
    result.update({"column_id": result.pop("column_id"), "assignee": initials(assignee["name"]) if assignee else None, "comments": [dict(comment) for comment in comments]})
    return result


def current_membership(connection: sqlite3.Connection, user_id: str) -> sqlite3.Row:
    membership = connection.execute("SELECT * FROM workspace_members WHERE user_id = ? ORDER BY joined_at LIMIT 1", (user_id,)).fetchone()
    if not membership:
        raise error("WORKSPACE_NOT_FOUND", "No tienes un workspace disponible.", 404)
    return membership


def require_membership(connection: sqlite3.Connection, user_id: str, workspace_id: str) -> sqlite3.Row:
    membership = connection.execute("SELECT * FROM workspace_members WHERE user_id = ? AND workspace_id = ?", (user_id, workspace_id)).fetchone()
    if not membership:
        raise error("FORBIDDEN", "No tienes acceso a este workspace.", 403)
    return membership


def auth_user(authorization: str | None) -> tuple[sqlite3.Row, sqlite3.Row]:
    if not authorization or not authorization.startswith("Bearer "):
        raise error("UNAUTHORIZED", "Se requiere autenticación.", 401)
    with db() as connection:
        session = connection.execute("SELECT * FROM sessions WHERE token_hash = ?", (token_hash(authorization[7:]),)).fetchone()
        if not session or session["expires_at"] <= now():
            raise error("UNAUTHORIZED", "La sesión no es válida o ha expirado.", 401)
        user = connection.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
        if not user:
            raise error("UNAUTHORIZED", "La sesión no es válida.", 401)
        return user, session


def get_auth(authorization: str | None = Header(default=None)) -> tuple[sqlite3.Row, sqlite3.Row]:
    return auth_user(authorization)


class LoginBody(BaseModel):
    email: str
    password: str


class ProfileBody(BaseModel):
    name: str
    email: str


class PasswordBody(BaseModel):
    currentPassword: str
    newPassword: str
    confirmPassword: str


class PreferencesBody(BaseModel):
    locale: str
    timezone: str
    notifications: bool


class WorkspaceBody(BaseModel):
    name: str


class ColumnBody(BaseModel):
    title: str
    color: str = "#D8D5CB"
    workspace_id: str | None = None


class TaskBody(BaseModel):
    title: str
    column_id: str
    description: str = ""
    tag: str = "Producto"
    priority: str = "Media"
    assignee: str | None = None
    estimate: str = "0 pts"
    date: str | None = None
    attachment: str | None = None


class TaskPatch(BaseModel):
    title: str | None = None
    description: str | None = None
    tag: str | None = None
    priority: str | None = None
    assignee: str | None = None
    estimate: str | None = None
    date: str | None = None
    attachment: str | None = None


class MoveBody(BaseModel):
    column_id: str
    position: int = 0


class CommentBody(BaseModel):
    text: str


class AssigneeBody(BaseModel):
    assignee: str | None = None


class NotificationBody(BaseModel):
    id: str


app = FastAPI(title="Voltage API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("CLIENT_ORIGIN", "http://localhost:5173")], allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exception: HTTPException) -> JSONResponse:
    detail = exception.detail if isinstance(exception.detail, dict) else {"code": "HTTP_ERROR", "message": str(exception.detail)}
    return JSONResponse(status_code=exception.status_code, content={"error": detail})


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api")
@app.get("/api/health")
def health() -> dict[str, str]:
    return {"service": "voltage-backend", "status": "ok", "environment": "development"}


@app.post("/api/auth/login")
def login(body: LoginBody) -> dict[str, Any]:
    with db() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (body.email.strip().lower(),)).fetchone()
        if not user or not bcrypt.checkpw(body.password.encode(), user["password_hash"].encode()):
            raise error("INVALID_CREDENTIALS", "El correo o la contraseña no son válidos.", 401)
        token = secrets.token_urlsafe(32)
        expires = datetime.now(timezone.utc) + timedelta(hours=SESSION_TTL_HOURS)
        connection.execute("INSERT INTO sessions VALUES (?, ?, ?, ?)", (secrets.token_urlsafe(16), user["id"], token_hash(token), expires.isoformat()))
        return {"token": token, "user": user_json(user), "expiresAt": expires.isoformat()}


@app.post("/api/auth/logout", status_code=204)
def logout(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> Response:
    with db() as connection:
        connection.execute("DELETE FROM sessions WHERE id = ?", (auth[1]["id"],))
    return Response(status_code=204)


@app.get("/api/auth/me")
def me(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    return {"user": user_json(auth[0])}


@app.get("/api/workspaces/current")
def workspace(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        membership = current_membership(connection, auth[0]["id"])
        workspace_row = connection.execute("SELECT * FROM workspaces WHERE id = ?", (membership["workspace_id"],)).fetchone()
        columns = connection.execute("SELECT * FROM columns WHERE workspace_id = ? ORDER BY position", (workspace_row["id"],)).fetchall()
        tasks = connection.execute("SELECT * FROM tasks WHERE workspace_id = ? ORDER BY position", (workspace_row["id"],)).fetchall()
        return {"workspace": {"id": workspace_row["id"], "name": workspace_row["name"], "columns": [{**dict(column), "taskIds": [task["id"] for task in tasks if task["column_id"] == column["id"]]} for column in columns], "tasks": [task_json(connection, task) for task in tasks]}}


@app.post("/api/workspaces", status_code=201)
def create_workspace(body: WorkspaceBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    if not body.name.strip() or len(body.name.strip()) > 100:
        raise error("VALIDATION_ERROR", "El nombre del workspace es obligatorio.", 422)
    workspace_id = secrets.token_urlsafe(12)
    with db() as connection:
        connection.execute("INSERT INTO workspaces VALUES (?, ?)", (workspace_id, body.name.strip()))
        connection.execute("INSERT INTO workspace_members VALUES (?, ?, ?, ?)", (auth[0]["id"], workspace_id, "owner", now()))
    return {"workspace": {"id": workspace_id, "name": body.name.strip()}}


@app.post("/api/columns", status_code=201)
def create_column(body: ColumnBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        workspace_id = body.workspace_id or current_membership(connection, auth[0]["id"])["workspace_id"]
        require_membership(connection, auth[0]["id"], workspace_id)
        title = body.title.strip()
        if not title or len(title) > 80:
            raise error("VALIDATION_ERROR", "El título de la columna es obligatorio.", 422)
        position = connection.execute("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM columns WHERE workspace_id = ?", (workspace_id,)).fetchone()["position"]
        column_id = secrets.token_urlsafe(12)
        connection.execute("INSERT INTO columns VALUES (?, ?, ?, ?, ?)", (column_id, workspace_id, title, body.color.strip(), position))
        return {"id": column_id, "workspace_id": workspace_id, "title": title, "color": body.color.strip(), "position": position, "taskIds": []}


@app.patch("/api/columns/{column_id}")
def rename_column(column_id: str, body: ColumnBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        column = connection.execute("SELECT * FROM columns WHERE id = ?", (column_id,)).fetchone()
        if not column:
            raise error("COLUMN_NOT_FOUND", "La columna no existe.", 404)
        require_membership(connection, auth[0]["id"], column["workspace_id"])
        title = body.title.strip()
        if not title or len(title) > 80:
            raise error("VALIDATION_ERROR", "El título de la columna es obligatorio.", 422)
        connection.execute("UPDATE columns SET title = ? WHERE id = ?", (title, column_id))
        return {**dict(column), "title": title, "taskIds": []}


@app.delete("/api/columns/{column_id}", status_code=204)
def delete_column(column_id: str, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> Response:
    with db() as connection:
        column = connection.execute("SELECT * FROM columns WHERE id = ?", (column_id,)).fetchone()
        if not column:
            raise error("COLUMN_NOT_FOUND", "La columna no existe.", 404)
        membership = require_membership(connection, auth[0]["id"], column["workspace_id"])
        if membership["role"] not in ("owner", "admin"):
            raise error("FORBIDDEN", "Solo un administrador puede eliminar columnas.", 403)
        connection.execute("DELETE FROM columns WHERE id = ?", (column_id,))
    return Response(status_code=204)


@app.post("/api/tasks", status_code=201)
def create_task(body: TaskBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    if not body.title.strip() or len(body.title.strip()) > 160:
        raise error("VALIDATION_ERROR", "El título de la tarea es obligatorio.", 422)
    if body.priority not in ("Alta", "Media", "Baja"):
        raise error("VALIDATION_ERROR", "La prioridad no es válida.", 422)
    with db() as connection:
        column = connection.execute("SELECT * FROM columns WHERE id = ?", (body.column_id,)).fetchone()
        if not column:
            raise error("COLUMN_NOT_FOUND", "La columna no existe.", 404)
        require_membership(connection, auth[0]["id"], column["workspace_id"])
        assignee_id = resolve_assignee(connection, body.assignee)
        position = connection.execute("SELECT COALESCE(MAX(position), -1) + 1 AS position FROM tasks WHERE column_id = ?", (column["id"],)).fetchone()["position"]
        task_id = secrets.token_urlsafe(12)
        values = (task_id, column["workspace_id"], column["id"], body.title.strip(), body.description, body.tag, body.priority, assignee_id, body.estimate, body.date, position, body.attachment)
        connection.execute("INSERT INTO tasks VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", values)
        return task_json(connection, connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone())


def resolve_assignee(connection: sqlite3.Connection, value: str | None) -> str | None:
    if not value:
        return None
    users = connection.execute("SELECT id, name FROM users").fetchall()
    for user in users:
        if user["id"] == value or initials(user["name"]) == value.upper():
            return user["id"]
    raise error("VALIDATION_ERROR", "El usuario asignado no existe.", 422)


def get_task(connection: sqlite3.Connection, task_id: str) -> sqlite3.Row:
    task = connection.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if not task:
        raise error("TASK_NOT_FOUND", "La tarea no existe.", 404)
    return task


@app.get("/api/tasks/{task_id}")
def read_task(task_id: str, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        task = get_task(connection, task_id)
        require_membership(connection, auth[0]["id"], task["workspace_id"])
        return task_json(connection, task)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: str, body: TaskPatch, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        task = get_task(connection, task_id)
        require_membership(connection, auth[0]["id"], task["workspace_id"])
        values = body.model_dump(exclude_unset=True)
        if "title" in values and (not values["title"].strip() or len(values["title"].strip()) > 160):
            raise error("VALIDATION_ERROR", "El título de la tarea es obligatorio.", 422)
        if "priority" in values and values["priority"] not in ("Alta", "Media", "Baja"):
            raise error("VALIDATION_ERROR", "La prioridad no es válida.", 422)
        if "assignee" in values:
            values["assignee_id"] = resolve_assignee(connection, values.pop("assignee"))
        if "title" in values:
            values["title"] = values["title"].strip()
        if values:
            connection.execute(f"UPDATE tasks SET {', '.join(f'{key} = ?' for key in values)} WHERE id = ?", (*values.values(), task_id))
        return task_json(connection, get_task(connection, task_id))


@app.patch("/api/tasks/{task_id}/assignee")
def assign_task(task_id: str, body: AssigneeBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    task = update_task(task_id, TaskPatch(assignee=body.assignee), auth)
    return {"assignee": task["assignee"], **task}


@app.patch("/api/tasks/{task_id}/move")
def move_task(task_id: str, body: MoveBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        task = get_task(connection, task_id)
        require_membership(connection, auth[0]["id"], task["workspace_id"])
        column = connection.execute("SELECT * FROM columns WHERE id = ?", (body.column_id,)).fetchone()
        if not column or column["workspace_id"] != task["workspace_id"]:
            raise error("COLUMN_NOT_FOUND", "La columna no existe.", 404)
        siblings = connection.execute("SELECT id FROM tasks WHERE column_id = ? AND id != ? ORDER BY position", (body.column_id, task_id)).fetchall()
        position = max(0, min(body.position, len(siblings)))
        ordered = [item["id"] for item in siblings]
        ordered.insert(position, task_id)
        for index, item_id in enumerate(ordered):
            connection.execute("UPDATE tasks SET column_id = ?, position = ? WHERE id = ?", (body.column_id, index, item_id))
        return task_json(connection, get_task(connection, task_id))


@app.post("/api/tasks/{task_id}/comments", status_code=201)
def add_comment(task_id: str, body: CommentBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    text = body.text.strip()
    if not text or len(text) > 2000:
        raise error("VALIDATION_ERROR", "El comentario no puede estar vacío.", 422)
    with db() as connection:
        task = get_task(connection, task_id)
        require_membership(connection, auth[0]["id"], task["workspace_id"])
        comment = (secrets.token_urlsafe(12), task_id, auth[0]["id"], initials(auth[0]["name"]), text, now())
        connection.execute("INSERT INTO comments VALUES (?, ?, ?, ?, ?, ?)", comment)
        return dict(connection.execute("SELECT id, author, text, created_at AS createdAt FROM comments WHERE id = ?", (comment[0],)).fetchone())


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: str, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> Response:
    with db() as connection:
        task = get_task(connection, task_id)
        membership = require_membership(connection, auth[0]["id"], task["workspace_id"])
        if membership["role"] not in ("owner", "admin"):
            raise error("FORBIDDEN", "No tienes permiso para eliminar tareas.", 403)
        connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    return Response(status_code=204)


@app.get("/api/me/profile")
def profile(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    return {"profile": user_json(auth[0])}


@app.patch("/api/me/profile")
def update_profile(body: ProfileBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    import re
    name, email = body.name.strip(), body.email.strip().lower()
    if not name or len(name) > 100 or not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email):
        raise error("VALIDATION_ERROR", "El nombre y el correo electrónico no son válidos.", 422)
    with db() as connection:
        duplicate = connection.execute("SELECT 1 FROM users WHERE email = ? AND id != ?", (email, auth[0]["id"])).fetchone()
        if duplicate:
            raise error("EMAIL_IN_USE", "Ese correo electrónico ya está en uso.", 409)
        connection.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", (name, email, auth[0]["id"]))
        return {"profile": user_json(connection.execute("SELECT * FROM users WHERE id = ?", (auth[0]["id"],)).fetchone())}


@app.post("/api/me/password", status_code=204)
def change_password(body: PasswordBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> Response:
    if not body.currentPassword or len(body.newPassword) < 8 or body.newPassword != body.confirmPassword or body.currentPassword == body.newPassword:
        raise error("VALIDATION_ERROR", "La nueva contraseña debe tener al menos 8 caracteres y coincidir con su confirmación.", 422)
    if not bcrypt.checkpw(body.currentPassword.encode(), auth[0]["password_hash"].encode()):
        raise error("INVALID_PASSWORD", "La contraseña actual no es válida.", 401)
    with db() as connection:
        connection.execute("UPDATE users SET password_hash = ? WHERE id = ?", (bcrypt.hashpw(body.newPassword.encode(), bcrypt.gensalt()).decode(), auth[0]["id"]))
        connection.execute("DELETE FROM sessions WHERE user_id = ? AND id != ?", (auth[0]["id"], auth[1]["id"]))
    return Response(status_code=204)


@app.get("/api/me/preferences")
def preferences(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        result = connection.execute("SELECT locale, timezone, notifications FROM preferences WHERE user_id = ?", (auth[0]["id"],)).fetchone()
        return {"preferences": dict(result) if result else {"locale": "es", "timezone": "America/Caracas", "notifications": True}}


@app.put("/api/me/preferences")
def update_preferences(body: PreferencesBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    if body.locale not in ("es", "en") or body.timezone not in ("America/Caracas", "America/New_York", "Europe/Madrid"):
        raise error("VALIDATION_ERROR", "Las preferencias no son válidas.", 422)
    with db() as connection:
        connection.execute("INSERT INTO preferences VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET locale=excluded.locale, timezone=excluded.timezone, notifications=excluded.notifications", (auth[0]["id"], body.locale, body.timezone, int(body.notifications)))
        return {"preferences": {"locale": body.locale, "timezone": body.timezone, "notifications": body.notifications}}


@app.get("/api/integrations")
def integrations(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        workspace_id = current_membership(connection, auth[0]["id"])["workspace_id"]
        return {"integrations": [dict(row) for row in connection.execute("SELECT id, workspace_id, name, description, connected, connected_at AS connectedAt FROM integrations WHERE workspace_id = ? ORDER BY name", (workspace_id,)).fetchall()]}


def set_integration(integration_id: str, connected: bool, auth: tuple[sqlite3.Row, sqlite3.Row]) -> dict[str, Any]:
    with db() as connection:
        integration = connection.execute("SELECT * FROM integrations WHERE id = ?", (integration_id,)).fetchone()
        if not integration:
            raise error("INTEGRATION_NOT_FOUND", "La integración no existe.", 404)
        require_membership(connection, auth[0]["id"], integration["workspace_id"])
        connected_at = now() if connected else None
        connection.execute("UPDATE integrations SET connected = ?, connected_at = ? WHERE id = ?", (int(connected), connected_at, integration_id))
        return {"integration": dict(connection.execute("SELECT id, workspace_id, name, description, connected, connected_at AS connectedAt FROM integrations WHERE id = ?", (integration_id,)).fetchone())}


@app.post("/api/integrations/{integration_id}/connect")
def connect_integration(integration_id: str, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    return set_integration(integration_id, True, auth)


@app.post("/api/integrations/{integration_id}/disconnect")
def disconnect_integration(integration_id: str, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    return set_integration(integration_id, False, auth)


@app.get("/api/notifications")
def notifications(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        rows = connection.execute("SELECT id, user_id, workspace_id, title, detail AS message, read_at AS readAt, created_at AS createdAt FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (auth[0]["id"],)).fetchall()
        return {"notifications": [dict(row) for row in rows]}


@app.post("/api/notifications/read", status_code=200)
def read_notification(body: NotificationBody, auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> dict[str, Any]:
    with db() as connection:
        notification = connection.execute("SELECT id FROM notifications WHERE id = ? AND user_id = ?", (body.id, auth[0]["id"])).fetchone()
        if not notification:
            raise error("NOTIFICATION_NOT_FOUND", "La notificación no existe.", 404)
        connection.execute("UPDATE notifications SET read_at = ? WHERE id = ?", (now(), body.id))
        return {"notification": dict(connection.execute("SELECT id, read_at AS readAt FROM notifications WHERE id = ?", (body.id,)).fetchone())}


@app.post("/api/notifications/read-all", status_code=204)
def read_all_notifications(auth: tuple[sqlite3.Row, sqlite3.Row] = Depends(get_auth)) -> Response:
    with db() as connection:
        connection.execute("UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL", (now(), auth[0]["id"]))
    return Response(status_code=204)


init_db()
