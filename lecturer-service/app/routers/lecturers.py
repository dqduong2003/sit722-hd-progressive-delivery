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
from app.models import Lecturer
from app.schemas import (
    LecturerCreate,
    LecturerResponse,
    LecturerUpdate,
    MessageResponse,
    PhotoUploadResponse,
)
from app.storage import (
    generate_lecturer_photo_url,
    upload_lecturer_photo,
)

router = APIRouter(
    prefix="/lecturers",
    tags=["Lecturers"],
)

def build_lecturer_response(
    lecturer: Lecturer,
) -> LecturerResponse:
    response = LecturerResponse.model_validate(
        lecturer
    )

    return response.model_copy(
        update={
            "profile_photo_url":
                generate_lecturer_photo_url(
                    lecturer.profile_photo_url
                )
        }
    )

@router.post(
    "",
    response_model=LecturerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_lecturer(
    lecturer_data: LecturerCreate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Lecturer:
    existing_lecturer = db.get(
        Lecturer,
        lecturer_data.lecturer_id,
    )

    if existing_lecturer is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Lecturer ID is already registered.",
        )

    existing_email = db.scalar(
        select(Lecturer).where(Lecturer.email == lecturer_data.email)
    )

    if existing_email is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered.",
        )

    lecturer = Lecturer(**lecturer_data.model_dump())

    db.add(lecturer)
    db.commit()
    db.refresh(lecturer)

    return lecturer


@router.get(
    "",
    response_model=list[LecturerResponse],
)
def get_all_lecturers(
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> list[LecturerResponse]:
    statement = select(Lecturer).order_by(
        Lecturer.lecturer_id
    )

    lecturers = list(
        db.scalars(statement).all()
    )

    return [
        build_lecturer_response(lecturer)
        for lecturer in lecturers
    ]


@router.get(
    "/{lecturer_id}",
    response_model=LecturerResponse,
)
def get_lecturer(
    lecturer_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
) -> Lecturer:
    lecturer = db.get(Lecturer, lecturer_id)

    if lecturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer not found.",
        )

    return build_lecturer_response(lecturer)


@router.put(
    "/{lecturer_id}",
    response_model=LecturerResponse,
)
def update_lecturer(
    lecturer_id: str,
    lecturer_data: LecturerUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> Lecturer:
    lecturer = db.get(Lecturer, lecturer_id)

    if lecturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer not found.",
        )

    update_data = lecturer_data.model_dump(exclude_unset=True)

    if "email" in update_data:
        email_exists = db.scalar(
            select(Lecturer).where(
                Lecturer.email == update_data["email"],
                Lecturer.lecturer_id != lecturer_id,
            )
        )

        if email_exists is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email address is already registered.",
            )

    for field, value in update_data.items():
        setattr(lecturer, field, value)

    db.commit()
    db.refresh(lecturer)

    return lecturer


@router.delete(
    "/{lecturer_id}",
    response_model=MessageResponse,
)
def delete_lecturer(
    lecturer_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> MessageResponse:
    lecturer = db.get(Lecturer, lecturer_id)

    if lecturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer not found.",
        )

    db.delete(lecturer)
    db.commit()

    return MessageResponse(message="Lecturer deleted successfully.")


@router.post(
    "/{lecturer_id}/profile-photo",
    response_model=PhotoUploadResponse,
)
async def upload_profile_photo(
    lecturer_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
) -> PhotoUploadResponse:
    lecturer = db.get(Lecturer, lecturer_id)

    if lecturer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecturer not found.",
        )

    photo_url = await upload_lecturer_photo(
        lecturer_id=lecturer_id,
        file=file,
    )

    lecturer.profile_photo_url = photo_url

    db.commit()
    db.refresh(lecturer)

    return PhotoUploadResponse(
    lecturer_id=lecturer.lecturer_id,
    profile_photo_url=(
        generate_lecturer_photo_url(
            lecturer.profile_photo_url
        )
    ),
    message="Profile photo uploaded successfully.",
)
