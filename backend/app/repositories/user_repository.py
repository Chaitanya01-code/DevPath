from uuid import UUID

from sqlalchemy import func, or_, select
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

    def list_students(
        self, *, query: str | None, offset: int, limit: int
    ) -> tuple[list[User], int]:
        statement = select(User).options(joinedload(User.domain))
        count_statement = select(func.count(User.id))
        if query:
            pattern = f"%{query.strip()}%"
            condition = or_(User.name.ilike(pattern), User.email.ilike(pattern))
            statement = statement.where(condition)
            count_statement = count_statement.where(condition)
        users = list(
            self.session.scalars(statement.order_by(User.created_at.desc()).offset(offset).limit(limit)).all()
        )
        total = int(self.session.scalar(count_statement) or 0)
        return users, total

    def count_students(self) -> int:
        return int(self.session.scalar(select(func.count(User.id))) or 0)

    def update_student(self, user: User, values: dict[str, object]) -> User:
        for field, value in values.items():
            setattr(user, field, value)
        self.session.commit()
        return self.get_by_id(user.id) or user
