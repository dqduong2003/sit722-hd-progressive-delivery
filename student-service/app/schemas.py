from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import StudentStatus


class StudentBase(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100,
        examples=["Aarav"],
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
        examples=["Sharma"],
    )

    email: EmailStr = Field(
        examples=["aarav.sharma@koalatech.edu.au"],
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
        examples=["0400123456"],
    )

    date_of_birth: date | None = Field(
        default=None,
        examples=["2000-05-15"],
    )

    program: str = Field(
        min_length=2,
        max_length=150,
        examples=["Master of Information Technology"],
    )

    year_level: int = Field(
        default=1,
        ge=1,
        le=10,
    )

    status: StudentStatus = StudentStatus.ACTIVE


class StudentCreate(StudentBase):
    student_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["S123456"],
    )


class StudentUpdate(BaseModel):
    first_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    last_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        max_length=30,
    )

    date_of_birth: date | None = None

    program: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    year_level: int | None = Field(
        default=None,
        ge=1,
        le=10,
    )

    status: StudentStatus | None = None


class StudentResponse(StudentBase):
    model_config = ConfigDict(from_attributes=True)

    student_id: str
    profile_photo_url: str | None
    created_at: datetime
    updated_at: datetime


class PhotoUploadResponse(BaseModel):
    student_id: str
    profile_photo_url: str
    message: str


class MessageResponse(BaseModel):
    message: str