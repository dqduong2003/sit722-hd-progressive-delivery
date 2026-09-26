import os
from pathlib import Path
from uuid import uuid4

from azure.core.exceptions import AzureError, ResourceExistsError
from dotenv import load_dotenv
from fastapi import HTTPException, UploadFile, status


from datetime import datetime, timedelta, timezone
from urllib.parse import unquote, urlparse

from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    ContentSettings,
    generate_blob_sas,
)

load_dotenv()


AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

AZURE_STORAGE_CONTAINER_NAME = os.getenv(
    "AZURE_STORAGE_CONTAINER_NAME",
    "lecturer-profile-photos",
)

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
}


def get_blob_service_client() -> BlobServiceClient:
    if not AZURE_STORAGE_CONNECTION_STRING:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure Blob Storage is not configured.",
        )

    return BlobServiceClient.from_connection_string(AZURE_STORAGE_CONNECTION_STRING)


def ensure_container_exists() -> None:
    if not AZURE_STORAGE_CONNECTION_STRING:
        return

    blob_service_client = get_blob_service_client()

    container_client = blob_service_client.get_container_client(
        AZURE_STORAGE_CONTAINER_NAME
    )

    try:
        container_client.create_container()
    except ResourceExistsError:
        pass


async def upload_lecturer_photo(
    lecturer_id: str,
    file: UploadFile,
) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid file type. Only JPEG, PNG and WEBP " "images are allowed."
            ),
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile photo must not exceed 5 MB.",
        )

    file_extension = Path(file.filename or "").suffix.lower()

    if not file_extension:
        file_extension = ".jpg"

    blob_name = f"lecturers/{lecturer_id}/" f"{uuid4().hex}{file_extension}"

    try:
        blob_service_client = get_blob_service_client()

        blob_client = blob_service_client.get_blob_client(
            container=AZURE_STORAGE_CONTAINER_NAME,
            blob=blob_name,
        )

        blob_client.upload_blob(
            file_content,
            overwrite=True,
            content_settings=ContentSettings(content_type=file.content_type),
        )

        return blob_client.url

    except HTTPException:
        raise

    except AzureError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to upload the profile photo.",
        ) from exc


def generate_lecturer_photo_url(
    photo_url: str | None,
) -> str | None:
    if not photo_url:
        return None

    try:
        blob_service_client = get_blob_service_client()

        parsed_url = urlparse(photo_url)

        path = unquote(parsed_url.path.lstrip("/"))

        container_prefix = f"{AZURE_STORAGE_CONTAINER_NAME}/"

        if path.startswith(container_prefix):
            blob_name = path[len(container_prefix) :]
        else:
            blob_name = path

        account_key = blob_service_client.credential.account_key

        sas_token = generate_blob_sas(
            account_name=(blob_service_client.account_name),
            container_name=(AZURE_STORAGE_CONTAINER_NAME),
            blob_name=blob_name,
            account_key=account_key,
            permission=BlobSasPermissions(read=True),
            expiry=(datetime.now(timezone.utc) + timedelta(hours=1)),
        )

        return f"{photo_url}?{sas_token}"

    except Exception:
        return photo_url
