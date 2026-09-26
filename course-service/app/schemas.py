from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import CourseStatus


class CourseBase(BaseModel):
    course_code: str = Field(
        min_length=2,
        max_length=20,
        examples=["ICT701"],
    )

    course_name: str = Field(
        min_length=2,
        max_length=200,
        examples=["Cloud Computing and DevOps"],
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
        examples=[
            "Introduces cloud platforms, containers, Kubernetes and DevOps."
        ],
    )

    credit_points: int = Field(
        default=12,
        ge=1,
        le=100,
    )

    lecturer_id: str | None = Field(
        default=None,
        min_length=3,
        max_length=20,
        examples=["L10001"],
    )

    semester: str = Field(
        min_length=2,
        max_length=50,
        examples=["Semester 1"],
    )

    academic_year: int = Field(
        ge=2000,
        le=2100,
        examples=[2026],
    )

    status: CourseStatus = CourseStatus.ACTIVE


class CourseCreate(CourseBase):
    course_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["C10001"],
    )


class CourseUpdate(BaseModel):
    course_code: str | None = Field(
        default=None,
        min_length=2,
        max_length=20,
    )

    course_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=2000,
    )

    credit_points: int | None = Field(
        default=None,
        ge=1,
        le=100,
    )

    lecturer_id: str | None = Field(
        default=None,
        min_length=3,
        max_length=20,
    )

    semester: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    academic_year: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
    )

    status: CourseStatus | None = None


class LecturerAssignment(BaseModel):
    lecturer_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["L10001"],
    )


class CourseResponse(CourseBase):
    model_config = ConfigDict(from_attributes=True)

    course_id: str
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    message: str