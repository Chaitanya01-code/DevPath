# DevPath frontend

## Requirements

- Node.js 18+
- npm
- The DevPath API running locally (see `../backend/README.md`)

## Setup

From the `frontend` directory, install dependencies and create the local environment file:

```powershell
npm install
Copy-Item .env.example .env
```

Set `VITE_API_URL` in `.env` if the API is hosted somewhere other than `http://localhost:8000/api/v1`. Start the Vite development server:

```powershell
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`). The backend interactive API documentation is available at `http://localhost:8000/docs`.
