from fastapi import APIRouter
from fastapi import HTTPException, status

from app.core.deps import CurrentUser, DatabaseSession
from app.schemas.user import UserDomainUpdate, UserRead
from app.services.auth_service import AuthService, InvalidDomainError

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> UserRead:
    return user


@router.patch("/me/domain", response_model=UserRead)
def update_my_domain(
    domain_update: UserDomainUpdate,
    user: CurrentUser,
    session: DatabaseSession,
) -> UserRead:
    try:
        return AuthService(session).update_user_domain(user, domain_update.domain_id)
    except InvalidDomainError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid domain",
        ) from error
