from fastapi import APIRouter

from app.core.deps import CurrentAdmin
from app.schemas.auth import AdminRead

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/me", response_model=AdminRead)
def get_admin_me(admin: CurrentAdmin) -> AdminRead:
    return AdminRead(username=admin.username)
