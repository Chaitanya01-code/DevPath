from fastapi import APIRouter

from app.core.deps import DatabaseSession
from app.schemas.user import DomainRead
from app.services.domain_service import DomainService

router = APIRouter(tags=["domains"])


@router.get("/domains", response_model=list[DomainRead])
def get_domains(session: DatabaseSession) -> list[DomainRead]:
    return DomainService(session).list_domains()
