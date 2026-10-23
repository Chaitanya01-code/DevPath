from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        statement = select(User).options(joinedload(User.domain)).where(User.email == email)
        return self.session.scalar(statement)

    def get_by_id(self, user_id: UUID) -> User | None:
        statement = select(User).options(joinedload(User.domain)).where(User.id == user_id)
        return self.session.scalar(statement)

    def create(
        self,
        *,
        name: str,
        email: str,
        hashed_password: str,
        domain_id: int,
    ) -> User:
        user = User(
            name=name,
            email=email,
            hashed_password=hashed_password,
            domain_id=domain_id,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return self.get_by_id(user.id) or user

    def update_domain(self, user: User, domain_id: int) -> User:
        user.domain_id = domain_id
        self.session.commit()
        return self.get_by_id(user.id) or user
