"""
In-app chat permissions, booking chat availability, and message text validation.
"""

from typing import Any
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound


def validate_sender(sender: Any) -> None:
    """
    Validate message sender user object.

    :param sender: User object.
    :raises PermissionDenied: If sender is missing or unauthenticated.
    """
    if not sender or not getattr(sender, 'is_authenticated', False):
        raise PermissionDenied("Authentication required to send chat messages.")


def validate_receiver(receiver: Any) -> None:
    """
    Validate message receiver user object.

    :param receiver: User object.
    :raises NotFound: If receiver user does not exist.
    """
    if not receiver:
        raise NotFound("Chat receiver user not found.")


def validate_booking_chat(booking: Any) -> None:
    """
    Validate that chat room is enabled for the booking (assigned worker exists and booking is active).

    :param booking: Booking instance.
    :raises ValidationError: If booking is cancelled or has no assigned worker.
    """
    if not booking:
        raise NotFound("Booking not found.")

    if not booking.worker_id:
        raise ValidationError({"detail": "Chat is unavailable until a captain is assigned to the booking."})

    if booking.status in ["cancelled"]:
        raise ValidationError({"detail": "Chat is disabled for cancelled bookings."})


def validate_chat_access(booking: Any, user: Any) -> None:
    """
    Validate that user (customer or assigned worker or admin) has permission to participate in booking chat.

    :param booking: Booking model instance.
    :param user: User instance.
    :raises PermissionDenied: If user is not customer or assigned worker on booking.
    """
    validate_sender(user)
    validate_booking_chat(booking)

    if user.is_staff or getattr(user, 'role', '') == 'admin':
        return

    is_customer = booking.customer_id == user.id
    is_worker = booking.worker_id == user.id

    if not (is_customer or is_worker):
        raise PermissionDenied("You are not authorized to view or participate in this booking chat.")


def validate_message(message_text: str) -> str:
    """
    Validate chat message payload text content.

    :param message_text: Raw message text.
    :return: Stripped message text.
    :raises ValidationError: If message is empty or exceeds character limits.
    """
    if not message_text or not isinstance(message_text, str):
        raise ValidationError({"message": "Message text cannot be empty."})

    cleaned_msg = message_text.strip()
    if len(cleaned_msg) == 0:
        raise ValidationError({"message": "Message text cannot be whitespace."})

    if len(cleaned_msg) > 2000:
        raise ValidationError({"message": "Message text exceeds maximum length (2000 characters)."})

    return cleaned_msg
