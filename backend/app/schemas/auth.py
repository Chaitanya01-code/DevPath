from typing import Literal

from pydantic import AliasChoices, BaseModel, Field


class LoginRequest(BaseModel):
    identifier: str = Field(
        min_length=1,
        max_length=320,
        validation_alias=AliasChoices("identifier", "email"),
    )
    password: str = Field(min_length=1, max_length=72)


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=72)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: Literal["user", "admin"]


class AdminRead(BaseModel):
    username: str
