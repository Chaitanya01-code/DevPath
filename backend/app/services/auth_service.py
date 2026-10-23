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
from app.models.admin import Admin
from app.models.user import User
from app.repositories.admin_repository import AdminRepository
from app.repositories.domain_repository import DomainRepository
from app.repositories.user_repository import UserRepository
from app.schemas.auth import AdminLoginRequest, LoginRequest, Token
from app.schemas.user import UserCreate


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InvalidDomainError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


class AuthService:
    def __init__(self, session: Session) -> None:
        self.session = session
        self.users = UserRepository(session)
        self.admins = AdminRepository(session)
        self.domains = DomainRepository(session)

    def signup(self, user_data: UserCreate) -> User:
        if self.users.get_by_email(str(user_data.email).lower()) is not None:
            raise DuplicateEmailError

        domain = (
            self.domains.get_by_id(user_data.domain_id)
            if user_data.domain_id is not None
            else self.domains.get_not_decided()
        )
        if domain is None:
            raise InvalidDomainError
        if not domain.is_active:
            raise InvalidDomainError

        try:
            return self.users.create(
                name=user_data.name,
                email=str(user_data.email).lower(),
                hashed_password=hash_password(user_data.password),
                domain_id=domain.id,
            )
        except IntegrityError as error:
            self.session.rollback()
            if self.users.get_by_email(str(user_data.email).lower()) is not None:
                raise DuplicateEmailError from error
            raise

    def login(self, credentials: LoginRequest) -> Token:
        identifier = credentials.identifier.strip()
        user = self.users.get_by_email(identifier.lower())
        admin = self.admins.get_by_username(identifier)

        if user is not None and self.admins.get_by_username_case_insensitive(identifier) is not None:
            raise InvalidCredentialsError

        if admin is not None:
            if not verify_password(credentials.password, admin.hashed_password):
                raise InvalidCredentialsError
            return Token(
                access_token=create_access_token(str(admin.id), role="admin"),
                role="admin",
            )

        if (
            user is None
            or not user.is_active
            or not verify_password(credentials.password, user.hashed_password)
        ):
            raise InvalidCredentialsError
        return Token(
            access_token=create_access_token(str(user.id), role="user"),
            role="user",
        )

    def admin_login(self, credentials: AdminLoginRequest) -> Token:
        admin = self.admins.get_by_username(credentials.username)
        if admin is None or not verify_password(credentials.password, admin.hashed_password):
            raise InvalidCredentialsError
        return Token(
            access_token=create_access_token(str(admin.id), role="admin"),
            role="admin",
        )

    def initialize_admin(self, username: str, password: str) -> bool:
        if self.admins.exists():
            return False
        try:
            admin = self.admins.create_if_empty(username, hash_password(password))
        except IntegrityError:
            self.session.rollback()
            if not self.admins.exists():
                raise
            return False
        return admin is not None

    def update_user_domain(self, user: User, domain_id: int) -> User:
        if self.domains.get_by_id(domain_id) is None:
            raise InvalidDomainError
        return self.users.update_domain(user, domain_id)

    def get_user_from_token(self, token: str) -> User:
        subject = self._get_subject(token, expected_role="user")
        user = self.users.get_by_id(subject)
        if user is None:
            raise InvalidTokenError
        return user

    def get_admin_from_token(self, token: str) -> Admin:
        subject = self._get_subject(token, expected_role="admin")
        admin = self.admins.get_by_id(subject)
        if admin is None:
            raise InvalidTokenError
        return admin

    @staticmethod
    def _get_subject(token: str, expected_role: str) -> UUID:
        try:
            payload = decode_access_token(token)
            subject = payload.get("sub")
            role = payload.get("role")
            if role != expected_role or not isinstance(subject, str):
                raise InvalidTokenError
            return UUID(subject)
        except (JWTError, ValueError) as error:
            raise InvalidTokenError from error
