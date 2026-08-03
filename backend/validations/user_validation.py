"""
User authentication and access validation rules for Workizo accounts.
"""

import re
from typing import Dict, List, Optional, Tuple, Any
from rest_framework.exceptions import ValidationError, AuthenticationFailed, PermissionDenied
from rest_framework_simplejwt.tokens import AccessToken


def validate_password_strength(password: str) -> None:
    """
    Validate that password meets minimum complexity requirements.

    :param password: Plaintext password.
    :raises ValidationError: If password is weak.
    """
    if not password or len(password) < 6:
        raise ValidationError({"password": "Password must be at least 6 characters long."})


def validate_role(role: str, allowed_roles: Optional[List[str]] = None) -> None:
    """
    Validate user role string.

    :param role: Role string (customer, worker, admin).
    :param allowed_roles: List of allowed roles.
    :raises ValidationError: If role is unrecognized or disallowed.
    """
    valid_roles = allowed_roles or ["customer", "worker", "admin"]
    if not role or role.lower() not in valid_roles:
        raise ValidationError({"role": f"Invalid user role. Allowed roles: {', '.join(valid_roles)}."})


def validate_login(email: str, password: str) -> Tuple[str, str]:
    """
    Validate credentials payload for user login.

    :param email: User email string.
    :param password: User password string.
    :return: Tuple of cleaned (email, password).
    :raises ValidationError: If missing or malformed credentials payload.
    """
    if not email or not isinstance(email, str):
        raise ValidationError({"email": "Email address is required."})
    if not password or not isinstance(password, str):
        raise ValidationError({"password": "Password is required."})

    cleaned_email = email.strip().lower()
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, cleaned_email):
        raise ValidationError({"email": "Enter a valid email address."})

    return cleaned_email, password.strip()


def validate_registration(email: str, password: str, full_name: str, role: str) -> Dict[str, Any]:
    """
    Validate complete user registration payload.

    :param email: Email address.
    :param password: Password.
    :param full_name: User full name.
    :param role: Desired account role.
    :return: Cleaned registration payload.
    :raises ValidationError: If registration fields are invalid.
    """
    cleaned_email, _ = validate_login(email, password)
    validate_password_strength(password)
    validate_role(role, allowed_roles=["customer", "worker", "admin"])

    if not full_name or not isinstance(full_name, str) or len(full_name.strip()) < 2:
        raise ValidationError({"full_name": "Full name must be at least 2 characters long."})

    return {
        "email": cleaned_email,
        "password": password,
        "full_name": full_name.strip(),
        "role": role.lower()
    }


def validate_jwt(token: str) -> Dict[str, Any]:
    """
    Validate JWT access token authenticity and expiration.

    :param token: JWT token string.
    :return: Decoded token payload dictionary.
    :raises AuthenticationFailed: If token is expired, corrupted, or invalid.
    """
    if not token or not isinstance(token, str):
        raise AuthenticationFailed("JWT authentication token is required.")

    token_str = token.replace("Bearer ", "").strip()
    try:
        access_token = AccessToken(token_str)
        return access_token.payload
    except Exception as exc:
        raise AuthenticationFailed(f"Invalid or expired JWT token: {str(exc)}")
