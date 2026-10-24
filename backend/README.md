# DevPath backend

## Requirements

- Python 3.11+
- PostgreSQL (local, Neon, or Supabase)

## Setup

From the `backend` directory, create and activate a virtual environment:

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies and configure the environment:

```powershell
python -m pip install -r requirements.txt
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

If a `.env` already exists, keep its `DATABASE_URL` and add or update settings in place rather than replacing it. Create a PostgreSQL database named `skillora` for a local setup, or retain your Neon or other PostgreSQL URL. Remote PostgreSQL URLs use `sslmode=require`. Use a long, random `SECRET_KEY` before deploying.

Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` to configure the initial admin account. Keep these values private. On startup, DevPath creates the admin only when the `admins` table is empty; it does not change an existing admin.

Run the migrations and start the API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

## Configuration

`DATABASE_URL` must use the `postgresql+psycopg://` SQLAlchemy URL format. `CORS_ORIGINS` accepts a comma-separated list of browser origins. `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 60.

## Roadmaps and administration

The migration seeds the selectable domains and creates the roadmap, step, resource, and student-progress tables. Students can browse published roadmaps after signing in, track step completion, and change their learning domain. Admin-only management APIs are under `/api/v1/admin`; the frontend admin sign-in is at `/admin/login`. Roadmap resources accept HTTP(S) URLs only.
