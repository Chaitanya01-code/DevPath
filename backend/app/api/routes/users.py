from fastapi import APIRouter

from app.core.deps import CurrentUser
from app.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: CurrentUser) -> UserRead:
    return user
