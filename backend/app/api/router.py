from fastapi import APIRouter

from app.api.routes import admin, auth, domains, health, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(domains.router)
api_router.include_router(admin.router)
api_router.include_router(health.router)
