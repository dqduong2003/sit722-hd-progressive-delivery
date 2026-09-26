from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import EmploymentStatus


class LecturerBase(BaseModel):
    first_name: str = Field(
        min_length=1,
        max_length=100,
        examples=["Emily"],
    )

    last_name: str = Field(
        min_length=1,
        max_length=100,
        examples=["Wilson"],
    )

    email: EmailStr = Field(
        examples=["emily.wilson@koalatech.edu.au"],
    )

    phone: str | None = Field(
        default=None,
        max_length=30,
        examples=["0400123456"],
    )

    school: str = Field(
        min_length=2,
        max_length=150,
        examples=["School of Information Technology"],
    )

    designation: str = Field(
        min_length=2,
        max_length=100,
        examples=["Senior Lecturer"],
    )

    office_location: str | None = Field(
        default=None,
        max_length=100,
        examples=["Building A, Room 204"],
    )

    employment_status: EmploymentStatus = EmploymentStatus.ACTIVE


class LecturerCreate(LecturerBase):
    lecturer_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["L10001"],
    )


class LecturerUpdate(BaseModel):
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

    school: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    designation: str | None = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    office_location: str | None = Field(
        default=None,
        max_length=100,
    )

    employment_status: EmploymentStatus | None = None


class LecturerResponse(LecturerBase):
    model_config = ConfigDict(from_attributes=True)

    lecturer_id: str
    profile_photo_url: str | None
    created_at: datetime
    updated_at: datetime


class PhotoUploadResponse(BaseModel):
    lecturer_id: str
    profile_photo_url: str
    message: str


class MessageResponse(BaseModel):
    message: str