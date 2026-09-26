from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import EnrollmentStatus


class EnrollmentCreate(BaseModel):
    student_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["S123456"],
    )

    course_id: str = Field(
        min_length=3,
        max_length=20,
        examples=["C10001"],
    )

    status: EnrollmentStatus = EnrollmentStatus.ENROLLED


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus


class EnrollmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    enrollment_id: int
    student_id: str
    course_id: str
    status: EnrollmentStatus
    enrolled_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    message: str