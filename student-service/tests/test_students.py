from fastapi.testclient import TestClient


def create_student(
    client: TestClient,
    admin_headers: dict[str, str],
    student_data: dict,
):
    return client.post(
        "/students",
        headers=admin_headers,
        json=student_data,
    )


def test_admin_can_create_student(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
):
    response = create_student(
        client,
        admin_headers,
        sample_student,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["student_id"] == "S123456"
    assert data["first_name"] == "Aarav"
    assert data["status"] == "active"
    assert data["profile_photo_url"] is None


def test_authenticated_user_can_get_all_students(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = client.get(
        "/students",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_authenticated_user_can_get_student(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = client.get(
        "/students/S123456",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert response.json()["student_id"] == "S123456"


def test_admin_can_update_student(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = client.put(
        "/students/S123456",
        headers=admin_headers,
        json={
            "year_level": 2,
            "status": "inactive",
        },
    )

    assert response.status_code == 200
    assert response.json()["year_level"] == 2
    assert response.json()["status"] == "inactive"


def test_admin_can_delete_student(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = client.delete(
        "/students/S123456",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Student deleted successfully."
    )


def test_student_cannot_create_student(
    client: TestClient,
    student_headers: dict[str, str],
    sample_student: dict,
):
    response = client.post(
        "/students",
        headers=student_headers,
        json=sample_student,
    )

    assert response.status_code == 403


def test_student_cannot_update_student(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = client.put(
        "/students/S123456",
        headers=student_headers,
        json={
            "year_level": 3,
        },
    )

    assert response.status_code == 403


def test_duplicate_student_id_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    response = create_student(
        client,
        admin_headers,
        sample_student,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Student ID is already registered."
    )


def test_duplicate_email_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    second_student = sample_student.copy()

    second_student["student_id"] = "S654321"

    response = create_student(
        client,
        admin_headers,
        second_student,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Email address is already registered."
    )


def test_unknown_student_returns_404(
    client: TestClient,
    student_headers: dict[str, str],
):
    response = client.get(
        "/students/UNKNOWN",
        headers=student_headers,
    )

    assert response.status_code == 404


def test_request_without_token_returns_401(
    client: TestClient,
):
    response = client.get("/students")

    assert response.status_code == 401


def test_admin_can_upload_profile_photo(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_student: dict,
    monkeypatch,
):
    create_student(
        client,
        admin_headers,
        sample_student,
    )

    async def mock_upload_student_photo(
        student_id,
        file,
    ):
        return (
            "https://example.blob.core.windows.net/"
            "student-profile-photos/"
            f"{student_id}/photo.jpg"
        )

    monkeypatch.setattr(
        "app.routers.students.upload_student_photo",
        mock_upload_student_photo,
    )

    response = client.post(
        "/students/S123456/profile-photo",
        headers=admin_headers,
        files={
            "file": (
                "photo.jpg",
                b"fake-image-content",
                "image/jpeg",
            )
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["student_id"] == "S123456"
    assert data["profile_photo_url"].endswith(
        "/S123456/photo.jpg"
    )
