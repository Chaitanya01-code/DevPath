from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.domain import Domain


NOT_DECIDED_DOMAIN_NAME = "Not decided yet"


class DomainRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_all(self) -> list[Domain]:
        return list(self.session.scalars(select(Domain).order_by(Domain.id)).all())

    def get_by_id(self, domain_id: int) -> Domain | None:
        return self.session.get(Domain, domain_id)

    def get_not_decided(self) -> Domain | None:
        return self.session.scalar(
            select(Domain).where(Domain.name == NOT_DECIDED_DOMAIN_NAME)
        )
