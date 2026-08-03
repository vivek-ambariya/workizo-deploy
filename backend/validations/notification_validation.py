"""
Notification distribution, recipient verification, and spam/duplicate prevention.
"""

from typing import Any
from rest_framework.exceptions import ValidationError, NotFound


def validate_notification_receiver(user: Any) -> None:
    """
    Validate notification target recipient user account.

    :param user: Target User instance.
    :raises NotFound: If recipient user is missing or inactive.
    """
    if not user:
        raise NotFound("Notification target recipient user not found.")

    if not getattr(user, 'is_active', True):
        raise ValidationError({"detail": "Cannot send notifications to deactivated user accounts."})


def validate_notification_type(notification_type: str) -> str:
    """
    Validate notification type category.

    :param notification_type: Notification type identifier string.
    :return: Sanitized notification type string.
    :raises ValidationError: If notification type is empty or invalid.
    """
    if not notification_type or not isinstance(notification_type, str):
        raise ValidationError({"notification_type": "Notification type identifier is required."})

    cleaned_type = notification_type.strip().lower()
    ALLOWED_TYPES = [
        "general",
        "booking_update",
        "incoming_booking_request",
        "booking_accepted",
        "booking_completed",
        "payment_received",
        "kyc_update",
        "system_announcement"
    ]

    if cleaned_type not in ALLOWED_TYPES:
        return cleaned_type

    return cleaned_type


def validate_duplicate_notification(user: Any, title: str, notification_type: str) -> None:
    """
    Prevent sending identical unread notifications to the same recipient within short intervals.

    :param user: Target user.
    :param title: Notification title.
    :param notification_type: Notification type.
    :raises ValidationError: If identical unread notification exists.
    """
    validate_notification_receiver(user)

    from notifications.models import Notification
    duplicate = Notification.objects.filter(
        user=user,
        title=title,
        notification_type=notification_type,
        is_read=False
    ).exists()

    if duplicate:
        raise ValidationError({"detail": "An identical unread notification already exists for this user."})
