"""
Customer profile and address validation rules for Workizo customers.
"""

from typing import Dict, Any
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound


def validate_customer(user: Any) -> None:
    """
    Validate that user instance represents an active Customer account.

    :param user: User model instance.
    :raises PermissionDenied: If user is not a customer.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        raise PermissionDenied("User authentication required.")

    if getattr(user, 'role', '') != 'customer' and not getattr(user, 'is_staff', False):
        raise PermissionDenied("Only customer accounts can perform this action.")


def validate_address(address_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate customer service address attributes.

    :param address_data: Dictionary containing address details.
    :return: Cleaned address dictionary.
    :raises ValidationError: If address or pincode is invalid.
    """
    if not isinstance(address_data, dict):
        raise ValidationError({"address": "Address payload must be a JSON object."})

    address = address_data.get("address", "").strip() if isinstance(address_data.get("address"), str) else ""
    if not address:
        raise ValidationError({"address": "Service street address is required."})

    pincode = str(address_data.get("pincode", "")).strip()
    if pincode and (len(pincode) < 5 or len(pincode) > 10):
        raise ValidationError({"pincode": "Invalid postal pincode format."})

    return {
        "address": address,
        "pincode": pincode,
        "city": address_data.get("city", "").strip() if isinstance(address_data.get("city"), str) else "",
        "state": address_data.get("state", "").strip() if isinstance(address_data.get("state"), str) else "",
    }


def validate_profile(customer_profile: Any) -> None:
    """
    Validate customer profile existence and state.

    :param customer_profile: CustomerProfile instance.
    :raises NotFound: If profile does not exist.
    """
    if not customer_profile:
        raise NotFound("Customer profile not found.")


def validate_booking_limit(customer: Any) -> None:
    """
    Validate that customer has not exceeded simultaneous active booking limits.

    :param customer: Customer user object.
    :raises ValidationError: If active booking limit is reached.
    """
    if not customer:
        return

    from bookings.models import Booking
    active_count = Booking.objects.filter(
        customer=customer,
        status__in=["searching", "accepted", "in_progress", "ready_to_complete"]
    ).count()

    MAX_ACTIVE_BOOKINGS = 5
    if active_count >= MAX_ACTIVE_BOOKINGS:
        raise ValidationError({
            "detail": f"Maximum active booking limit ({MAX_ACTIVE_BOOKINGS}) reached. Complete or cancel pending bookings first."
        })
