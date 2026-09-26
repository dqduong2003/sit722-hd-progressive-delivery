from fastapi.testclient import TestClient


def create_course(
    client: TestClient,
    admin_headers: dict[str, str],
    course_data: dict,
):
    return client.post(
        "/courses",
        headers=admin_headers,
        json=course_data,
    )


def test_admin_can_create_course(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    response = create_course(
        client,
        admin_headers,
        sample_course,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["course_id"] == "C10001"
    assert data["course_code"] == "ICT701"
    assert data["status"] == "active"
    assert data["lecturer_id"] is None


def test_authenticated_user_can_get_all_courses(
    client: TestClient,
    admin_headers: dict[str, str],
    student_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.get(
        "/courses",
        headers=student_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1


def test_authenticated_user_can_get_course(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.get(
        "/courses/C10001",
        headers=lecturer_headers,
    )

    assert response.status_code == 200
    assert response.json()["course_id"] == "C10001"


def test_admin_can_update_course(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.put(
        "/courses/C10001",
        headers=admin_headers,
        json={
            "course_name": "Advanced Cloud and DevOps",
            "credit_points": 24,
        },
    )

    assert response.status_code == 200
    assert response.json()["course_name"] == (
        "Advanced Cloud and DevOps"
    )
    assert response.json()["credit_points"] == 24


def test_admin_can_assign_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.patch(
        "/courses/C10001/lecturer",
        headers=admin_headers,
        json={
            "lecturer_id": "L10001",
        },
    )

    assert response.status_code == 200
    assert response.json()["lecturer_id"] == "L10001"


def test_admin_can_remove_lecturer(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    course_data = sample_course.copy()
    course_data["lecturer_id"] = "L10001"

    create_course(
        client,
        admin_headers,
        course_data,
    )

    response = client.delete(
        "/courses/C10001/lecturer",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["lecturer_id"] is None


def test_lecturer_can_view_assigned_courses(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_course: dict,
):
    course_data = sample_course.copy()
    course_data["lecturer_id"] = "L10001"

    create_course(
        client,
        admin_headers,
        course_data,
    )

    response = client.get(
        "/courses/lecturer/L10001/assigned",
        headers=lecturer_headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["lecturer_id"] == "L10001"


def test_admin_can_delete_course(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.delete(
        "/courses/C10001",
        headers=admin_headers,
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "Course deleted successfully."
    )


def test_student_cannot_create_course(
    client: TestClient,
    student_headers: dict[str, str],
    sample_course: dict,
):
    response = client.post(
        "/courses",
        headers=student_headers,
        json=sample_course,
    )

    assert response.status_code == 403


def test_lecturer_cannot_update_course(
    client: TestClient,
    admin_headers: dict[str, str],
    lecturer_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = client.put(
        "/courses/C10001",
        headers=lecturer_headers,
        json={
            "course_name": "Unauthorised Update",
        },
    )

    assert response.status_code == 403


def test_duplicate_course_id_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    response = create_course(
        client,
        admin_headers,
        sample_course,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Course ID is already registered."
    )


def test_duplicate_course_code_is_rejected(
    client: TestClient,
    admin_headers: dict[str, str],
    sample_course: dict,
):
    create_course(
        client,
        admin_headers,
        sample_course,
    )

    second_course = sample_course.copy()
    second_course["course_id"] = "C10002"

    response = create_course(
        client,
        admin_headers,
        second_course,
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Course code is already registered."
    )


def test_unknown_course_returns_404(
    client: TestClient,
    student_headers: dict[str, str],
):
    response = client.get(
        "/courses/UNKNOWN",
        headers=student_headers,
    )

    assert response.status_code == 404


def test_request_without_token_returns_401(
    client: TestClient,
):
    response = client.get("/courses")

    assert response.status_code == 401