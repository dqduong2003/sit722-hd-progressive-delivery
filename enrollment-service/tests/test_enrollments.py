from fastapi.testclient import TestClient


def create_enrollment(
    client: TestClient,
    admin_headers: dict[str, str],
    enrollment_data: dict,
):
    return client.post(
        "/enrollments",
        headers=admin_headers,
        json=enrollment_data,
    )


def test_admin_can_create_enrollment(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_enrollment: dict,
):
    response = create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["enrollment_id"] == 1
    assert data["student_id"] == "S123456"
    assert data["course_id"] == "C10001"
    assert data["status"] == "enrolled"


def test_admin_can_get_all_enrollments(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.get(
        "/enrollments",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_lecturer_can_get_all_enrollments(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.get(
        "/enrollments",
        headers=lecturer_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_authenticated_user_can_get_enrollment(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.get(
        "/enrollments/1",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert response.json()["enrollment_id"] == 1


def test_student_can_view_student_enrollments(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.get(
        "/enrollments/student/S123456",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["student_id"] == "S123456"


def test_lecturer_can_view_course_enrollments(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.get(
        "/enrollments/course/C10001",
        headers=lecturer_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["course_id"] == "C10001"


def test_admin_can_update_enrollment(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.put(
        "/enrollments/1",
        headers=admin_headers,
        json={
            "status": "completed",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "completed"


def test_admin_can_delete_enrollment(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = client.delete(
        "/enrollments/1",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Enrollment deleted successfully."
    )


def test_student_cannot_create_enrollment(
    client: TestClient,
    student_headers: dict[str, str],
    sample_enrollment: dict,
):
    response = client.post(
        "/enrollments",
        headers=student_headers,
        json=sample_enrollment,
    )

    assert response.status_code == 403


def test_lecturer_cannot_create_enrollment(
    client: TestClient,
    lecturer_headers: dict[str, str],
    sample_enrollment: dict,
):
    response = client.post(
        "/enrollments",
        headers=lecturer_headers,
        json=sample_enrollment,
    )

    assert response.status_code == 403


def test_student_cannot_get_all_enrollments(
    client: TestClient,
    student_headers: dict[str, str],
):
    response = client.get(
        "/enrollments",
        headers=student_headers,
    )

    assert response.status_code == 403


def test_duplicate_enrollment_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_enrollment: dict,
):
    create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    response = create_enrollment(
        client,
        admin_headers,
        sample_enrollment,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Student is already enrolled in this course."
    )


def test_unknown_enrollment_returns_404(
    client: TestClient,
    student_headers: dict[str, str],
):
    response = client.get(
        "/enrollments/999",
        headers=student_headers,
    )

    assert response.status_code == 404


def test_request_without_token_returns_401(
    client: TestClient,
):
    response = client.get("/enrollments")

    assert response.status_code == 401