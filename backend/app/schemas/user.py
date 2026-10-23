from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class DomainRead(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    domain_id: int | None = Field(default=None, gt=0)

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized


class UserRead(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    domain: DomainRead
    github_username: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserDomainUpdate(BaseModel):
    domain_id: Annotated[int, Field(gt=0)]
