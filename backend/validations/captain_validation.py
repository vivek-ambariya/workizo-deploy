"""
Worker/Captain authorization, verification, and KYC business validation.
"""

from typing import Any
from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound


def validate_kyc(profile: Any) -> None:
    """
    Validate worker KYC verification status.

    :param profile: WorkerProfile instance.
    :raises ValidationError: If worker KYC approval status is not approved or verified.
    """
    if not profile:
        raise NotFound("Worker profile does not exist.")

    approval_status = getattr(profile, 'approval_status', '')
    is_verified = getattr(profile, 'is_verified', False)

    if approval_status != 'approved' or not is_verified:
        raise ValidationError({
            "detail": "Worker KYC verification is pending or rejected. You cannot accept or perform jobs."
        })


def validate_availability(profile: Any) -> None:
    """
    Validate worker online availability to receive jobs.

    :param profile: WorkerProfile instance.
    :raises ValidationError: If worker is currently offline.
    """
    validate_kyc(profile)
    if not getattr(profile, 'online_status', False):
        raise ValidationError({"detail": "Worker must be online to receive job requests."})


def validate_online_status(profile: Any) -> None:
    """
    Validate worker profile status for online/offline toggling.

    :param profile: WorkerProfile instance.
    :raises ValidationError: If profile is not found or not approved.
    """
    if not profile:
        raise NotFound("Worker profile not found.")
    if getattr(profile, 'approval_status', '') != 'approved':
        raise ValidationError({"detail": "Only verified captains can switch online status."})


def validate_service_category(profile: Any) -> None:
    """
    Validate worker service category selection.

    :param profile: WorkerProfile instance.
    :raises ValidationError: If service category is unassigned.
    """
    if not profile or not getattr(profile, 'service_category', None):
        raise ValidationError({"detail": "Worker has no assigned service category."})


def validate_accept_booking(worker: Any, booking: Any) -> None:
    """
    Validate worker authorization and eligibility to accept a specific booking.

    :param worker: Worker user model instance.
    :param booking: Booking model instance.
    :raises PermissionDenied: If user is not a worker.
    :raises ValidationError: If worker is offline, unapproved, or category does not match.
    """
    if not worker or getattr(worker, 'role', '') != 'worker':
        raise PermissionDenied("Only workers can accept service requests.")

    profile = getattr(worker, 'worker_profile', None)
    if not profile:
        raise NotFound("Worker profile not found.")

    validate_availability(profile)

    if booking.service_category and profile.service_category:
        if booking.service_category.id != profile.service_category.id:
            raise ValidationError({
                "detail": "Worker service category does not match the requested booking category."
            })
