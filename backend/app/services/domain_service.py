from sqlalchemy.orm import Session

from app.models.domain import Domain
from app.repositories.domain_repository import DomainRepository


class DomainService:
    def __init__(self, session: Session) -> None:
        self.repository = DomainRepository(session)

    def list_domains(self) -> list[Domain]:
        return self.repository.list_all()
