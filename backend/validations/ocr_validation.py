"""
EasyOCR document parsing, Indian Aadhaar & PAN regex verification, and identity matching.
"""

import re
from typing import Dict, List, Any
from rest_framework.exceptions import ValidationError


def validate_aadhaar(aadhaar_number: str) -> str:
    """
    Validate 12-digit Indian Aadhaar number format.

    :param aadhaar_number: Raw Aadhaar string.
    :return: 12-digit numeric Aadhaar string without spaces.
    :raises ValidationError: If Aadhaar number is invalid.
    """
    if not aadhaar_number or not isinstance(aadhaar_number, str):
        raise ValidationError({"aadhaar": "Aadhaar number is required."})

    cleaned = aadhaar_number.replace(" ", "").replace("-", "").strip()
    if not re.match(r'^\d{12}$', cleaned):
        raise ValidationError({"aadhaar": "Aadhaar number must consist of exactly 12 numeric digits."})

    return cleaned


def validate_pan(pan_number: str) -> str:
    """
    Validate 10-character Indian Permanent Account Number (PAN) format (e.g. ABCDE1234F).

    :param pan_number: Raw PAN string.
    :return: Uppercase 10-character PAN string.
    :raises ValidationError: If PAN number is invalid.
    """
    if not pan_number or not isinstance(pan_number, str):
        raise ValidationError({"pan": "PAN card number is required."})

    cleaned = pan_number.strip().upper()
    pan_regex = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    if not re.match(pan_regex, cleaned):
        raise ValidationError({"pan": "Invalid PAN card number format (expected 5 letters, 4 numbers, 1 letter)."})

    return cleaned


def validate_document_fields(extracted_fields: Dict[str, Any], required_fields: List[str]) -> None:
    """
    Validate that mandatory fields were successfully parsed from OCR image scan.

    :param extracted_fields: Dictionary of OCR parsed values.
    :param required_fields: List of expected field keys.
    :raises ValidationError: If any expected field is missing from document scan.
    """
    if not isinstance(extracted_fields, dict):
        raise ValidationError({"detail": "OCR extracted fields payload must be a JSON object."})

    missing = []
    for field in required_fields:
        val = extracted_fields.get(field)
        if not val or (isinstance(val, str) and not val.strip()):
            missing.append(field)

    if missing:
        raise ValidationError({
            "detail": f"OCR failed to extract mandatory document fields: {', '.join(missing)}. Please upload a clearer image."
        })


def validate_document_match(ocr_name: str, user_name: str) -> bool:
    """
    Perform fuzzy token match between OCR scanned name and registered account full name.

    :param ocr_name: Name extracted from Aadhaar/PAN image.
    :param user_name: Account user full name.
    :return: True if names match acceptably, False otherwise.
    """
    if not ocr_name or not user_name:
        return False

    cleaned_ocr = set(re.findall(r'[a-zA-Z]+', ocr_name.lower()))
    cleaned_user = set(re.findall(r'[a-zA-Z]+', user_name.lower()))

    if not cleaned_ocr or not cleaned_user:
        return False

    # Check intersection of name tokens (first name, last name match)
    common_tokens = cleaned_ocr.intersection(cleaned_user)
    return len(common_tokens) > 0
