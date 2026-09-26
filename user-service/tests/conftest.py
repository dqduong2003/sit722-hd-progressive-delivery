import os

from dotenv import load_dotenv

# Load test environment before importing the app
load_dotenv(".env.test", override=True)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db
from app.main import app
from app.models import User, UserRole
from app.security import hash_password


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

    with Session(test_engine) as db:
        admin = User(
            username="admin",
            email="admin@koalatech.edu.au",
            hashed_password=hash_password(
                "AdminPassword123!"
            ),
            role=UserRole.ADMIN,
            is_active=True,
        )

        student = User(
            username="student1",
            email="student1@koalatech.edu.au",
            hashed_password=hash_password(
                "StudentPassword123!"
            ),
            role=UserRole.STUDENT,
            is_active=True,
        )

        db.add_all([admin, student])
        db.commit()

    yield

    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def admin_token(client: TestClient) -> str:
    response = client.post(
        "/auth/login",
        data={
            "username": "admin",
            "password": "AdminPassword123!",
        },
    )

    return response.json()["access_token"]


@pytest.fixture
def student_token(client: TestClient) -> str:
    response = client.post(
        "/auth/login",
        data={
            "username": "student1",
            "password": "StudentPassword123!",
        },
    )

    return response.json()["access_token"]