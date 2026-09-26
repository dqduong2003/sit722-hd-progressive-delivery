import os

from dotenv import load_dotenv

# Load test environment before importing the app
load_dotenv(".env.test", override=True)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.security import JWT_ALGORITHM, JWT_SECRET_KEY
import jwt


POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")
POSTGRES_DB = os.getenv("POSTGRES_DB", "students")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5434")

TEST_DATABASE_URL =  os.getenv(
    "DATABASE_URL",
    (
        f"postgresql+psycopg2://{POSTGRES_USER}:"
        f"{POSTGRES_PASSWORD}@{POSTGRES_HOST}:"
        f"{POSTGRES_PORT}/{POSTGRES_DB}"
    ),
)

test_engine = create_engine(
    TEST_DATABASE_URL,
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def create_test_token(
    user_id: str,
    role: str,
) -> str:
    return jwt.encode(
        {
            "sub": user_id,
            "role": role,
        },
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


@pytest.fixture
def admin_token() -> str:
    return create_test_token(
        user_id="1",
        role="admin",
    )


@pytest.fixture
def student_token() -> str:
    return create_test_token(
        user_id="2",
        role="student",
    )


@pytest.fixture
def admin_headers(admin_token: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {admin_token}"
    }


@pytest.fixture
def student_headers(
    student_token: str,
) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {student_token}"
    }


@pytest.fixture
def sample_student() -> dict:
    return {
        "student_id": "S123456",
        "first_name": "Aarav",
        "last_name": "Sharma",
        "email": "aarav.sharma@koalatech.edu.au",
        "phone": "0400123456",
        "date_of_birth": "2000-05-15",
        "program": "Master of Information Technology",
        "year_level": 1,
        "status": "active",
    }