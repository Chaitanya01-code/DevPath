from sqlalchemy import text
from sqlalchemy.orm import Session


class HealthRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def check_connection(self) -> None:
        self.session.execute(text("SELECT 1"))
