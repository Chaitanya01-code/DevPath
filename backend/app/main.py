import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.core.config import settings
from app.db.session import SessionLocal
from app.services.auth_service import AuthService
from app.services.health_service import HealthService

logger = logging.getLogger("skillora")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    try:
        with SessionLocal() as session:
            HealthService(session).check_database()
        logger.info("Database connection succeeded")
    except SQLAlchemyError as error:
        logger.error("Database connection failed during startup (%s)", type(error).__name__)
        yield
        return

    admin_username = settings.admin_username.strip()
    if not admin_username or not settings.admin_password:
        logger.warning(
            "Admin bootstrap skipped: ADMIN_USERNAME and ADMIN_PASSWORD must both be configured"
        )
    else:
        try:
            with SessionLocal() as session:
                created = AuthService(session).initialize_admin(
                    admin_username,
                    settings.admin_password,
                )
            if created:
                logger.info("Initial admin account created")
            else:
                logger.info("An admin account already exists; no account was changed")
        except SQLAlchemyError as error:
            logger.error("Admin bootstrap failed (%s)", type(error).__name__)

    yield


app = FastAPI(title="DevPath", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
