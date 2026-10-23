from sqlalchemy.orm import Session

from app.repositories.health_repository import HealthRepository


class HealthService:
    def __init__(self, session: Session) -> None:
        self.repository = HealthRepository(session)

    def check_database(self) -> None:
        self.repository.check_connection()
