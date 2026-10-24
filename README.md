# DevPath

DevPath is a structured learning platform foundation with a FastAPI/PostgreSQL backend and a React/TypeScript frontend.

## Backend

1. Install Python 3.11+ and PostgreSQL.
2. In a terminal, enter `backend`, create and activate a virtual environment, install the requirements, and copy the environment template:

   ```powershell
   cd backend
   py -3.11 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

3. Create a PostgreSQL database named `skillora` or change `DATABASE_URL` in `backend/.env`. Configure a long random `SECRET_KEY`.
4. Apply migrations and launch the API:

   ```powershell
   alembic upgrade head
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

## Frontend

1. In a second terminal, enter `frontend`, install dependencies, and copy the environment template:

   ```powershell
   cd frontend
   npm install
   Copy-Item .env.example .env
   ```

2. Set `VITE_API_URL` in `frontend/.env` if your API URL differs from `http://localhost:8000/api/v1`, then start the development server:

   ```powershell
   npm run dev
   ```

Open the URL printed by Vite, usually [http://localhost:5173](http://localhost:5173).
# DevPath
