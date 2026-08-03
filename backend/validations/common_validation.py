"""
Common validation utilities for generic data formats and types across Workizo.
"""

import re
import uuid
from datetime import datetime, date
from typing import Dict, List, Any
from rest_framework.exceptions import ValidationError


def validate_phone(phone: str) -> str:
    """
    Validate phone number format (E.164 or 10-digit Indian phone format).

    :param phone: Phone number string to validate.
    :return: Cleaned phone string.
    :raises ValidationError: If phone number is invalid.
    """
    if not phone or not isinstance(phone, str):
        raise ValidationError({"phone": "Phone number must be a non-empty string."})

    cleaned_phone = phone.strip()
    phone_pattern = r'^\+?[1-9]\d{7,14}$'
    if not re.match(phone_pattern, cleaned_phone):
        raise ValidationError({"phone": "Invalid phone number format."})

    return cleaned_phone


def validate_name(name: str) -> str:
    """
    Validate user or entity name.

    :param name: Name string to validate.
    :return: Stripped name string.
    :raises ValidationError: If name is empty or exceeds length limits.
    """
    if not name or not isinstance(name, str):
        raise ValidationError({"name": "Name must be a non-empty string."})

    cleaned_name = name.strip()
    if len(cleaned_name) < 2 or len(cleaned_name) > 150:
        raise ValidationError({"name": "Name must be between 2 and 150 characters."})

    return cleaned_name


def validate_date(date_str: str) -> date:
    """
    Validate ISO date string (YYYY-MM-DD).

    :param date_str: Date string to parse.
    :return: datetime.date object.
    :raises ValidationError: If date format is invalid.
    """
    if not date_str or not isinstance(date_str, str):
        raise ValidationError({"date": "Date must be a non-empty string."})

    try:
        return datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
    except ValueError:
        raise ValidationError({"date": "Invalid date format. Expected YYYY-MM-DD."})


def validate_uuid(uuid_str: str) -> str:
    """
    Validate string is a valid UUID4.

    :param uuid_str: UUID string to validate.
    :return: Canonical UUID string.
    :raises ValidationError: If string is not a valid UUID.
    """
    if not uuid_str or not isinstance(uuid_str, str):
        raise ValidationError({"uuid": "UUID must be a non-empty string."})

    try:
        val = uuid.UUID(uuid_str.strip(), version=4)
        return str(val)
    except ValueError:
        raise ValidationError({"uuid": "Invalid UUID string format."})


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """
    Validate that all required keys exist and are non-null in data dictionary.

    :param data: Input dictionary.
    :param required_fields: List of field names that must be present.
    :raises ValidationError: If any required field is missing or empty.
    """
    if not isinstance(data, dict):
        raise ValidationError({"detail": "Input data must be a JSON object."})

    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or (isinstance(data[field], str) and not data[field].strip()):
            missing_fields.append(field)

    if missing_fields:
        raise ValidationError({
            "detail": f"Missing required fields: {', '.join(missing_fields)}"
        })
