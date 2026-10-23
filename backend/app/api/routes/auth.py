from fastapi import APIRouter, HTTPException, status

from app.core.deps import DatabaseSession
from app.schemas.auth import AdminLoginRequest, LoginRequest, Token
from app.schemas.user import UserCreate, UserRead
from app.services.auth_service import (
    AuthService,
    DuplicateEmailError,
    InvalidCredentialsError,
    InvalidDomainError,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, session: DatabaseSession) -> UserRead:
    try:
        return AuthService(session).signup(user_data)
    except DuplicateEmailError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        ) from error
    except InvalidDomainError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid domain",
        ) from error


@router.post("/login", response_model=Token)
def login(credentials: LoginRequest, session: DatabaseSession) -> Token:
    try:
        return AuthService(session).login(credentials)
    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error


@router.post("/admin/login", response_model=Token)
def admin_login(credentials: AdminLoginRequest, session: DatabaseSession) -> Token:
    try:
        return AuthService(session).admin_login(credentials)
    except InvalidCredentialsError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin username or password",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
