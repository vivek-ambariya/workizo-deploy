"""
Email format, verification token, password reset token, and SMTP settings validation.
"""

import re
from typing import Dict, Any
from rest_framework.exceptions import ValidationError


def validate_email(email: str) -> str:
    """
    Validate email address format and normalize to lowercase.

    :param email: Input email string.
    :return: Normalized lowercase email.
    :raises ValidationError: If email format is invalid.
    """
    if not email or not isinstance(email, str):
        raise ValidationError({"email": "Email address is required."})

    cleaned_email = email.strip().lower()
    email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    if not re.match(email_regex, cleaned_email):
        raise ValidationError({"email": "Enter a valid email address."})

    return cleaned_email


def validate_verification_token(token: str) -> Any:
    """
    Validate email verification token string.

    :param token: Raw verification token string.
    :return: Sanitized token string.
    :raises ValidationError: If token is missing or empty.
    """
    if not token or not isinstance(token, str) or not token.strip():
        raise ValidationError({"token": "Email verification token is required."})

    return token.strip()


def validate_reset_token(token: str) -> Any:
    """
    Validate password reset token string.

    :param token: Raw password reset token string.
    :return: Sanitized reset token string.
    :raises ValidationError: If token is missing or empty.
    """
    if not token or not isinstance(token, str) or not token.strip():
        raise ValidationError({"token": "Password reset token is required."})

    return token.strip()


def validate_smtp(config: Dict[str, Any]) -> None:
    """
    Validate SMTP mail server configuration dictionary.

    :param config: Dictionary with host, port, host_user, host_password.
    :raises ValidationError: If SMTP configuration parameters are missing or invalid.
    """
    if not isinstance(config, dict):
        raise ValidationError({"detail": "SMTP configuration payload must be a JSON object."})

    host = config.get("host")
    port = config.get("port")
    user = config.get("host_user")

    if not host or not isinstance(host, str):
        raise ValidationError({"host": "SMTP host server domain is required."})

    try:
        int_port = int(port)
        if int_port <= 0 or int_port > 65535:
            raise ValueError()
    except (ValueError, TypeError):
        raise ValidationError({"port": "SMTP port must be an integer between 1 and 65535."})

    if not user or not isinstance(user, str):
        raise ValidationError({"host_user": "SMTP host username is required."})
