# Skillora backend

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
Copy-Item .env.example .env
```

Create a PostgreSQL database named `skillora` (or update `DATABASE_URL` in `.env` to an existing database). Use a long, random `SECRET_KEY` before deploying.

Run the initial migration and start the API:

```powershell
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`; interactive API documentation is at `http://localhost:8000/docs`.

## Configuration

`DATABASE_URL` must use the `postgresql+psycopg://` SQLAlchemy URL format. `CORS_ORIGINS` accepts a comma-separated list of browser origins. `ACCESS_TOKEN_EXPIRE_MINUTES` defaults to 60.
