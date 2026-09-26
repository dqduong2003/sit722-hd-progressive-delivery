import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class CourseStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ARCHIVED = "archived"


class Course(Base):
    __tablename__ = "courses"

    course_id: Mapped[str] = mapped_column(
        String(20),
        primary_key=True,
        index=True,
    )

    course_code: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        nullable=False,
        index=True,
    )

    course_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    credit_points: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=12,
    )

    lecturer_id: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True,
        index=True,
    )

    semester: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    academic_year: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    status: Mapped[CourseStatus] = mapped_column(
        Enum(
            CourseStatus,
            name="course_status",
            values_callable=lambda enum_class: [
                status.value for status in enum_class
            ],
        ),
        nullable=False,
        default=CourseStatus.ACTIVE,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )