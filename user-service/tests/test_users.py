from fastapi.testclient import TestClient


def test_admin_can_create_user(
    client: TestClient,
    admin_token: str,
):
    response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "username": "lecturer1",
            "email": "lecturer1@koalatech.edu.au",
            "password": "LecturerPassword123!",
            "role": "lecturer",
            "is_active": True,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "lecturer1"
    assert data["role"] == "lecturer"
    assert "hashed_password" not in data


def test_admin_can_get_all_users(
    client: TestClient,
    admin_token: str,
):
    response = client.get(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_admin_can_update_user(
    client: TestClient,
    admin_token: str,
):
    response = client.put(
        "/users/2",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "email": "updated.student@koalatech.edu.au",
            "is_active": False,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == (
        "updated.student@koalatech.edu.au"
    )
    assert data["is_active"] is False


def test_admin_can_delete_user(
    client: TestClient,
    admin_token: str,
):
    response = client.delete(
        "/users/2",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200
    assert response.json()["message"] == (
        "User deleted successfully."
    )


def test_admin_cannot_delete_own_account(
    client: TestClient,
    admin_token: str,
):
    response = client.delete(
        "/users/1",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 400


def test_student_cannot_manage_users(
    client: TestClient,
    student_token: str,
):
    response = client.get(
        "/users",
        headers={
            "Authorization": f"Bearer {student_token}"
        },
    )

    assert response.status_code == 403


def test_duplicate_username_is_rejected(
    client: TestClient,
    admin_token: str,
):
    response = client.post(
        "/users",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
        json={
            "username": "student1",
            "email": "another@koalatech.edu.au",
            "password": "AnotherPassword123!",
            "role": "student",
            "is_active": True,
        },
    )

    assert response.status_code == 409
    assert response.json()["detail"] == (
        "Username is already registered."
    )


def test_get_unknown_user_returns_404(
    client: TestClient,
    admin_token: str,
):
    response = client.get(
        "/users/999",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 404