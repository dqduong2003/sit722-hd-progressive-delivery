from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import UserRole


class UserBase(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
        examples=["admin"],
    )

    email: EmailStr = Field(
        examples=["admin@koalatech.edu.au"],
    )

    role: UserRole = UserRole.STUDENT

    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(
        min_length=8,
        max_length=128,
        examples=["StrongPassword123!"],
    )


class UserUpdate(BaseModel):
    username: str | None = Field(
        default=None,
        min_length=3,
        max_length=50,
    )

    email: EmailStr | None = None

    password: str | None = Field(
        default=None,
        min_length=8,
        max_length=128,
    )

    role: UserRole | None = None

    is_active: bool | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    exp: int


class MessageResponse(BaseModel):
    message: str