"""
Booking status transitions, ownership, assignment, and duplicate prevention validations.
"""

from typing import Union, List, Any
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound


def validate_booking_exists(booking_id: Union[int, str]) -> Any:
    """
    Validate that booking exists by ID.

    :param booking_id: Primary key of booking.
    :return: Booking model instance.
    :raises NotFound: If booking does not exist.
    """
    from bookings.models import Booking
    try:
        return Booking.objects.get(pk=booking_id)
    except (Booking.DoesNotExist, ValueError):
        raise NotFound(f"Booking with ID '{booking_id}' not found.")


def validate_booking_status(booking: Any, allowed_statuses: List[str]) -> None:
    """
    Validate that booking status is within allowed state list.

    :param booking: Booking instance.
    :param allowed_statuses: List of acceptable status strings.
    :raises ValidationError: If current status is not permitted.
    """
    current_status = getattr(booking, 'status', '')
    if current_status not in allowed_statuses:
        allowed_fmt = ", ".join([f"'{s}'" for s in allowed_statuses])
        raise ValidationError({
            "detail": f"Booking status '{current_status}' is invalid for this operation. Allowed statuses: {allowed_fmt}."
        })


def validate_booking_transition(current_status: str, target_status: str) -> None:
    """
    Validate state transition rules for booking lifecycle.

    :param current_status: Current status string.
    :param target_status: Desired status string.
    :raises ValidationError: If state transition is invalid.
    """
    ALLOWED_TRANSITIONS = {
        "searching": ["accepted", "cancelled"],
        "accepted": ["in_progress", "cancelled"],
        "in_progress": ["ready_to_complete", "cancelled"],
        "ready_to_complete": ["completed", "cancelled"],
        "completed": [],
        "cancelled": []
    }

    allowed_targets = ALLOWED_TRANSITIONS.get(current_status, [])
    if target_status not in allowed_targets:
        raise ValidationError({
            "detail": f"Cannot transition booking from '{current_status}' to '{target_status}'."
        })


def validate_booking_owner(booking: Any, user: Any) -> None:
    """
    Validate user authorization over a booking (customer owner, assigned worker, or admin).

    :param booking: Booking instance.
    :param user: User instance.
    :raises PermissionDenied: If user has no authorization to access booking.
    """
    if not user or not user.is_authenticated:
        raise PermissionDenied("Authentication required to access booking.")

    if user.is_staff or getattr(user, 'role', '') == 'admin':
        return

    is_customer = booking.customer_id == user.id
    is_worker = booking.worker_id == user.id

    if not (is_customer or is_worker):
        raise PermissionDenied("You do not have permission to access or modify this booking.")


def validate_booking_cancellation(booking: Any, user: Any) -> None:
    """
    Validate whether a booking can be cancelled by user.

    :param booking: Booking instance.
    :param user: User instance.
    :raises ValidationError: If booking is completed or cannot be cancelled.
    """
    validate_booking_owner(booking, user)
    if booking.status in ["completed", "cancelled"]:
        raise ValidationError({"detail": f"Cannot cancel booking with status '{booking.status}'."})


def validate_worker_assignment(worker: Any, booking: Any) -> None:
    """
    Validate worker assignment compatibility for a booking.

    :param worker: Worker user object.
    :param booking: Booking object.
    :raises ValidationError: If worker cannot be assigned to booking.
    """
    if not worker or getattr(worker, 'role', '') != 'worker':
        raise ValidationError({"detail": "Assigned user must be a worker."})

    if booking.worker_id and booking.worker_id != worker.id and booking.status not in ["searching", "accepted"]:
        raise ValidationError({"detail": "Booking is already assigned to another worker."})


def validate_duplicate_booking(customer: Any, service_category_id: int) -> None:
    """
    Prevent duplicate active booking creation for the same service category by the same customer.

    :param customer: Customer user object.
    :param service_category_id: Service category ID.
    :raises ValidationError: If duplicate pending booking exists.
    """
    if not customer:
        return

    from bookings.models import Booking
    duplicate = Booking.objects.filter(
        customer=customer,
        service_category_id=service_category_id,
        status__in=["searching", "accepted"]
    ).exists()

    if duplicate:
        raise ValidationError({
            "detail": "An active booking request for this service category already exists."
        })
