from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import get_current_user, require_admin
from app.models import Student
from app.schemas import (
    MessageResponse,
    PhotoUploadResponse,
    StudentCreate,
    StudentResponse,
    StudentUpdate,
)
from app.storage import (
    generate_student_photo_url,
    upload_student_photo,
)

router = APIRouter(
    prefix="/students",
    tags=["Students"],
)


def build_student_response(
    student: Student,
) -> StudentResponse:
    response = StudentResponse.model_validate(student)

    return response.model_copy(
        update={
            "profile_photo_url": (generate_student_photo_url(student.profile_photo_url))
        }
    )


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Student:
    existing_student = db.get(
        Student,
        student_data.student_id,
    )

    if existing_student is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Student ID is already registered.",
        )

    existing_email = db.scalar(
        select(Student).where(Student.email == student_data.email)
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered.",
        )

    student = Student(**student_data.model_dump())

    db.add(student)
    db.commit()
    db.refresh(student)

    return build_student_response(student)


@router.get(
    "",
    response_model=list[StudentResponse],
)
def get_all_students(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[StudentResponse]:
    statement = select(Student).order_by(Student.student_id)

    students = list(db.scalars(statement).all())

    return [build_student_response(student) for student in students]


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
)
def get_student(
    student_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> StudentResponse:
    student = db.get(Student, student_id)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    return build_student_response(student)


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
)
def update_student(
    student_id: str,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> StudentResponse:
    student = db.get(Student, student_id)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    update_data = student_data.model_dump(exclude_unset=True)

    if "email" in update_data:
        email_exists = db.scalar(
            select(Student).where(
                Student.email == update_data["email"],
                Student.student_id != student_id,
            )
        )

        if email_exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email address is already registered.",
            )

    for field, value in update_data.items():
        setattr(student, field, value)

    db.commit()
    db.refresh(student)

    return build_student_response(student)


@router.delete(
    "/{student_id}",
    response_model=MessageResponse,
)
def delete_student(
    student_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> MessageResponse:
    student = db.get(Student, student_id)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    db.delete(student)
    db.commit()

    return MessageResponse(message="Student deleted successfully.")


@router.post(
    "/{student_id}/profile-photo",
    response_model=PhotoUploadResponse,
)
async def upload_profile_photo(
    student_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> PhotoUploadResponse:
    student = db.get(Student, student_id)

    if student is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found.",
        )

    photo_url = await upload_student_photo(
        student_id=student_id,
        file=file,
    )

    student.profile_photo_url = photo_url

    db.commit()
    db.refresh(student)

    return PhotoUploadResponse(
        student_id=student.student_id,
        profile_photo_url=(generate_student_photo_url(student.profile_photo_url)),
        message="Profile photo uploaded successfully.",
    )
