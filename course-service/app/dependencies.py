from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.security import decode_access_token


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="http://localhost:8000/auth/login",
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")
        role = payload.get("role")

        if user_id is None or role is None:
            raise credentials_exception

        return {
            "user_id": user_id,
            "role": role,
        }

    except jwt.InvalidTokenError as exc:
        raise credentials_exception from exc


def require_roles(
    *allowed_roles: str,
) -> Callable:
    def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action.",
            )

        return current_user

    return role_checker


require_admin = require_roles("admin")
require_admin_or_lecturer = require_roles(
    "admin",
    "lecturer",
)