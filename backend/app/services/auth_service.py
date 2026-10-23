from uuid import UUID

from jose import JWTError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserCreate


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class AuthService:
    def __init__(self, session: Session) -> None:
        self.users = UserRepository(session)
        self.session = session

    def signup(self, user_data: UserCreate) -> User:
        if self.users.get_by_email(str(user_data.email)) is not None:
            raise DuplicateEmailError

        try:
            return self.users.create(
                full_name=user_data.full_name,
                email=str(user_data.email).lower(),
                hashed_password=hash_password(user_data.password),
            )
        except IntegrityError as error:
            self.session.rollback()
            raise DuplicateEmailError from error

    def login(self, credentials: LoginRequest) -> Token:
        user = self.users.get_by_email(str(credentials.email).lower())
        if user is None or not verify_password(credentials.password, user.hashed_password):
            raise InvalidCredentialsError
        return Token(access_token=create_access_token(str(user.id)))

    def get_user_from_token(self, token: str) -> User:
        try:
            subject = decode_access_token(token).get("sub")
            user_id = UUID(subject) if isinstance(subject, str) else None
        except (JWTError, ValueError) as error:
            raise InvalidTokenError from error

        if user_id is None:
            raise InvalidTokenError

        user = self.users.get_by_id(user_id)
        if user is None:
            raise InvalidTokenError
        return user
