from fastapi import APIRouter
from fastapi import HTTPException, status

from app.core.deps import CurrentUser, DatabaseSession
from app.schemas.user import LearningSummaryRead, UserDomainUpdate, UserProfileUpdate, UserRead
from app.services.auth_service import AuthService, InvalidDomainError
from app.services.domain_service import DomainService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> UserRead:
    return user


@router.patch("/me", response_model=UserRead)
def update_my_profile(
    payload: UserProfileUpdate,
    user: CurrentUser,
    session: DatabaseSession,
) -> UserRead:
    return AuthService(session).update_user_profile(user, payload)


@router.get("/me/learning-summary", response_model=LearningSummaryRead)
def get_my_learning_summary(
    user: CurrentUser,
    session: DatabaseSession,
) -> LearningSummaryRead:
    return DomainService(session).learning_summary(user.id)


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
