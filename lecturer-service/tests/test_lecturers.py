from fastapi.testclient import TestClient


def create_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_data: dict,
):
    return client.post(
        "/lecturers",
        headers=admin_headers,
        json=lecturer_data,
    )


def test_admin_can_create_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
):
    response = create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["lecturer_id"] == "L10001"
    assert data["first_name"] == "Emily"
    assert data["employment_status"] == "active"
    assert data["profile_photo_url"] is None


def test_authenticated_user_can_get_all_lecturers(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    response = client.get(
        "/lecturers",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_authenticated_user_can_get_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    response = client.get(
        "/lecturers/L10001",
        headers=lecturer_headers,
    )

    assert response.status_code == 200
    assert response.json()["lecturer_id"] == "L10001"


def test_admin_can_update_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    response = client.put(
        "/lecturers/L10001",
        headers=admin_headers,
        json={
            "designation": "Associate Professor",
            "employment_status": "on_leave",
        },
    )

    assert response.status_code == 200
    assert response.json()["designation"] == "Associate Professor"
    assert response.json()["employment_status"] == "on_leave"


def test_admin_can_delete_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    response = client.delete(
        "/lecturers/L10001",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Lecturer deleted successfully."
    )


def test_lecturer_cannot_create_lecturer(
    client: TestClient,
    lecturer_headers: dict[str, str],
    sample_lecturer: dict,
):
    response = client.post(
        "/lecturers",
        headers=lecturer_headers,
        json=sample_lecturer,
    )

    assert response.status_code == 403


def test_duplicate_lecturer_id_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    response = create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Lecturer ID is already registered."
    )


def test_duplicate_email_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    second_lecturer = sample_lecturer.copy()
    second_lecturer["lecturer_id"] = "L10002"

    response = create_lecturer(
        client,
        admin_headers,
        second_lecturer,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Email address is already registered."
    )


def test_unknown_lecturer_returns_404(
    client: TestClient,
    student_headers: dict[str, str],
):
    response = client.get(
        "/lecturers/UNKNOWN",
        headers=student_headers,
    )

    assert response.status_code == 404


def test_request_without_token_returns_401(
    client: TestClient,
):
    response = client.get("/lecturers")

    assert response.status_code == 401


def test_admin_can_upload_profile_photo(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_lecturer: dict,
    monkeypatch,
):
    create_lecturer(
        client,
        admin_headers,
        sample_lecturer,
    )

    async def mock_upload_lecturer_photo(
        lecturer_id,
        file,
    ):
        return (
            "https://example.blob.core.windows.net/"
            "lecturer-profile-photos/"
            f"{lecturer_id}/photo.jpg"
        )

    monkeypatch.setattr(
        "app.routers.lecturers.upload_lecturer_photo",
        mock_upload_lecturer_photo,
    )

    response = client.post(
        "/lecturers/L10001/profile-photo",
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

    assert data["lecturer_id"] == "L10001"
    assert data["profile_photo_url"].endswith(
        "/L10001/photo.jpg"
    )