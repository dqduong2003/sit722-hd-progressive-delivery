from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import (
    get_current_user,
    require_admin,
    require_admin_or_lecturer,
)
from app.models import Enrollment
from app.schemas import (
    EnrollmentCreate,
    EnrollmentResponse,
    EnrollmentUpdate,
    MessageResponse,
)


router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)


@router.post(
    "",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Enrollment:
    existing_enrollment = db.scalar(
        select(Enrollment).where(
            Enrollment.student_id == enrollment_data.student_id,
            Enrollment.course_id == enrollment_data.course_id,
        )
    )

    if existing_enrollment is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this course.",
        )

    enrollment = Enrollment(
        **enrollment_data.model_dump()
    )

    db.add(enrollment)

    try:
        db.commit()
        db.refresh(enrollment)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student is already enrolled in this course.",
        ) from exc

    return enrollment


@router.get(
    "",
    response_model=list[EnrollmentResponse],
)
def get_all_enrollments(
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_lecturer),
) -> list[Enrollment]:
    statement = select(Enrollment).order_by(
        Enrollment.enrollment_id
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{enrollment_id}",
    response_model=EnrollmentResponse,
)
def get_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> Enrollment:
    enrollment = db.get(
        Enrollment,
        enrollment_id,
    )

    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found.",
        )

    return enrollment


@router.get(
    "/student/{student_id}",
    response_model=list[EnrollmentResponse],
)
def get_student_enrollments(
    student_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[Enrollment]:
    statement = (
        select(Enrollment)
        .where(Enrollment.student_id == student_id)
        .order_by(Enrollment.enrollment_id)
    )

    return list(db.scalars(statement).all())


@router.get(
    "/course/{course_id}",
    response_model=list[EnrollmentResponse],
)
def get_course_enrollments(
    course_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin_or_lecturer),
) -> list[Enrollment]:
    statement = (
        select(Enrollment)
        .where(Enrollment.course_id == course_id)
        .order_by(Enrollment.enrollment_id)
    )

    return list(db.scalars(statement).all())


@router.put(
    "/{enrollment_id}",
    response_model=EnrollmentResponse,
)
def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Enrollment:
    enrollment = db.get(
        Enrollment,
        enrollment_id,
    )

    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found.",
        )

    enrollment.status = enrollment_data.status

    db.commit()
    db.refresh(enrollment)

    return enrollment


@router.delete(
    "/{enrollment_id}",
    response_model=MessageResponse,
)
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> MessageResponse:
    enrollment = db.get(
        Enrollment,
        enrollment_id,
    )

    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found.",
        )

    db.delete(enrollment)
    db.commit()

    return MessageResponse(
        message="Enrollment deleted successfully."
    )