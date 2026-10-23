import uuid

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app.models.admin import Admin


class AdminRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_username(self, username: str) -> Admin | None:
        return self.session.scalar(select(Admin).where(Admin.username == username))

    def get_by_username_case_insensitive(self, username: str) -> Admin | None:
        return self.session.scalar(
            select(Admin).where(func.lower(Admin.username) == username.lower())
        )

    def get_by_id(self, admin_id: uuid.UUID) -> Admin | None:
        return self.session.get(Admin, admin_id)

    def exists(self) -> bool:
        return bool(self.session.scalar(select(func.count()).select_from(Admin)))

    def create_if_empty(self, username: str, hashed_password: str) -> Admin | None:
        self.session.execute(text("SELECT pg_advisory_xact_lock(791204663)"))
        if self.exists():
            self.session.commit()
            return None

        admin = Admin(username=username, hashed_password=hashed_password)
        self.session.add(admin)
        self.session.commit()
        self.session.refresh(admin)
        return admin
