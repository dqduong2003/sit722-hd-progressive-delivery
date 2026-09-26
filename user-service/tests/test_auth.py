from fastapi.testclient import TestClient


def test_login_successful(
    client: TestClient,
):
    response = client.post(
        "/auth/login",
        data={
            "username": "admin",
            "password": "AdminPassword123!",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_with_incorrect_password(
    client: TestClient,
):
    response = client.post(
        "/auth/login",
        data={
            "username": "admin",
            "password": "IncorrectPassword",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == (
        "Incorrect username or password."
    )


def test_get_current_user(
    client: TestClient,
    admin_token: str,
):
    response = client.get(
        "/auth/me",
        headers={
            "Authorization": f"Bearer {admin_token}"
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "admin"
    assert data["role"] == "admin"
    assert data["is_active"] is True


def test_protected_endpoint_without_token(
    client: TestClient,
):
    response = client.get("/auth/me")

    assert response.status_code == 401