from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import (
    get_current_user,
    require_admin,
    require_admin_or_lecturer,
)
from app.models import Course
from app.schemas import (
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    LecturerAssignment,
    MessageResponse,
)


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.post(
    "",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Course:
    existing_course = db.get(
        Course,
        course_data.course_id,
    )

    if existing_course is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course ID is already registered.",
        )

    existing_code = db.scalar(
        select(Course).where(
            Course.course_code == course_data.course_code
        )
    )

    if existing_code is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course code is already registered.",
        )

    course = Course(
        **course_data.model_dump()
    )

    db.add(course)
    db.commit()
    db.refresh(course)

    return course


@router.get(
    "",
    response_model=list[CourseResponse],
)
def get_all_courses(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[Course]:
    statement = select(Course).order_by(
        Course.course_code
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    return course


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
)
def update_course(
    course_id: str,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    update_data = course_data.model_dump(
        exclude_unset=True
    )

    if "course_code" in update_data:
        course_code_exists = db.scalar(
            select(Course).where(
                Course.course_code == update_data["course_code"],
                Course.course_id != course_id,
            )
        )

        if course_code_exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Course code is already registered.",
            )

    for field, value in update_data.items():
        setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return course


@router.patch(
    "/{course_id}/lecturer",
    response_model=CourseResponse,
)
def assign_lecturer(
    course_id: str,
    assignment: LecturerAssignment,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    course.lecturer_id = assignment.lecturer_id

    db.commit()
    db.refresh(course)

    return course


@router.delete(
    "/{course_id}/lecturer",
    response_model=CourseResponse,
)
def remove_lecturer(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Course:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    course.lecturer_id = None

    db.commit()
    db.refresh(course)

    return course


@router.get(
    "/lecturer/{lecturer_id}/assigned",
    response_model=list[CourseResponse],
)
def get_courses_by_lecturer(
    lecturer_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_lecturer),
) -> list[Course]:
    statement = (
        select(Course)
        .where(Course.lecturer_id == lecturer_id)
        .order_by(Course.course_code)
    )

    return list(db.scalars(statement).all())


@router.delete(
    "/{course_id}",
    response_model=MessageResponse,
)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> MessageResponse:
    course = db.get(Course, course_id)

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found.",
        )

    db.delete(course)
    db.commit()

    return MessageResponse(
        message="Course deleted successfully."
    )