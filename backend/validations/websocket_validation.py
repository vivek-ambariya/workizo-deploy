"""
Django Channels WebSocket authentication, room access, and group channel authorization rules.
"""

import re
from typing import Dict, Union, Any
from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound


def validate_socket_user(user: Any) -> None:
    """
    Validate WebSocket channel user authentication status.

    :param user: User object from scope.
    :raises PermissionDenied: If socket connection user is anonymous or unauthenticated.
    """
    if not user or not getattr(user, 'is_authenticated', False):
        raise PermissionDenied("WebSocket connection rejected: Anonymous or unauthenticated user.")


def validate_room(room_name: str) -> str:
    """
    Validate WebSocket room name format.

    :param room_name: Room identifier string.
    :return: Sanitized room name.
    :raises ValidationError: If room name contains invalid characters or is empty.
    """
    if not room_name or not isinstance(room_name, str):
        raise ValidationError({"room": "WebSocket room name is required."})

    cleaned_room = room_name.strip()
    if not re.match(r'^[a-zA-Z0-9_\-]+$', cleaned_room):
        raise ValidationError({"room": "Invalid characters in WebSocket room name."})

    return cleaned_room


def validate_group(group_name: str) -> str:
    """
    Validate Django Channels group channel name string.

    :param group_name: Group channel string.
    :return: Sanitized group name.
    :raises ValidationError: If group name is invalid.
    """
    if not group_name or not isinstance(group_name, str):
        raise ValidationError({"group": "WebSocket group name is required."})

    cleaned_group = group_name.strip()
    if len(cleaned_group) > 100 or not re.match(r'^[a-zA-Z0-9_\-\.]+$', cleaned_group):
        raise ValidationError({"group": "Invalid WebSocket group name format."})

    return cleaned_group


def validate_connection(scope: Dict[str, Any]) -> Any:
    """
    Validate WebSocket connection scope and extract authenticated user.

    :param scope: Django Channels connection scope dictionary.
    :return: Authenticated User model instance.
    :raises PermissionDenied: If scope has no authenticated user.
    """
    if not isinstance(scope, dict):
        raise PermissionDenied("Invalid WebSocket scope dictionary.")

    user = scope.get("user")
    validate_socket_user(user)
    return user


def validate_socket_booking(booking_id: Union[int, str], user: Any) -> Any:
    """
    Validate WebSocket connection request for a specific booking group.

    :param booking_id: Primary key or tracking ID of booking.
    :param user: Authenticated User object.
    :return: Booking instance.
    :raises NotFound: If booking does not exist.
    :raises PermissionDenied: If user is not authorized to join booking group.
    """
    validate_socket_user(user)

    from bookings.models import Booking
    try:
        booking = Booking.objects.get(pk=booking_id)
    except (Booking.DoesNotExist, ValueError):
        raise NotFound(f"Booking #{booking_id} not found.")

    if user.is_staff or getattr(user, 'role', '') == 'admin':
        return booking

    is_customer = booking.customer_id == user.id
    is_worker = booking.worker_id == user.id

    if not (is_customer or is_worker):
        raise PermissionDenied("You are not authorized to subscribe to updates for this booking.")

    return booking
