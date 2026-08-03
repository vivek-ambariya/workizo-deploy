"""
Centralized Validation Layer Package for Workizo Backend Architecture.
"""

from .common_validation import (
    validate_phone,
    validate_name,
    validate_date,
    validate_uuid,
    validate_required_fields,
)
from .user_validation import (
    validate_login,
    validate_registration,
    validate_password_strength,
    validate_role,
    validate_jwt,
)
from .customer_validation import (
    validate_customer,
    validate_address,
    validate_profile,
    validate_booking_limit,
)
from .captain_validation import (
    validate_kyc,
    validate_availability,
    validate_online_status,
    validate_service_category,
    validate_accept_booking,
)
from .booking_validation import (
    validate_booking_exists,
    validate_booking_status,
    validate_booking_transition,
    validate_booking_owner,
    validate_booking_cancellation,
    validate_worker_assignment,
    validate_duplicate_booking,
)
from .payment_validation import (
    validate_payment_amount,
    validate_payment_status,
    validate_duplicate_payment,
    validate_cash_confirmation,
    validate_razorpay_signature,
    validate_invoice_payment,
)
from .invoice_validation import (
    validate_labour_charge,
    validate_spare_part,
    validate_quantity,
    validate_unit_price,
    validate_invoice_total,
    validate_invoice_lock,
)
from .chat_validation import (
    validate_chat_access,
    validate_booking_chat,
    validate_sender,
    validate_receiver,
    validate_message,
)
from .websocket_validation import (
    validate_socket_user,
    validate_socket_booking,
    validate_room,
    validate_group,
    validate_connection,
)
from .notification_validation import (
    validate_notification_receiver,
    validate_notification_type,
    validate_duplicate_notification,
)
from .email_validation import (
    validate_email,
    validate_verification_token,
    validate_reset_token,
    validate_smtp,
)
from .ocr_validation import (
    validate_aadhaar,
    validate_pan,
    validate_document_fields,
    validate_document_match,
)

__all__ = [
    # Common
    'validate_phone',
    'validate_name',
    'validate_date',
    'validate_uuid',
    'validate_required_fields',
    # User
    'validate_login',
    'validate_registration',
    'validate_password_strength',
    'validate_role',
    'validate_jwt',
    # Customer
    'validate_customer',
    'validate_address',
    'validate_profile',
    'validate_booking_limit',
    # Captain
    'validate_kyc',
    'validate_availability',
    'validate_online_status',
    'validate_service_category',
    'validate_accept_booking',
    # Booking
    'validate_booking_exists',
    'validate_booking_status',
    'validate_booking_transition',
    'validate_booking_owner',
    'validate_booking_cancellation',
    'validate_worker_assignment',
    'validate_duplicate_booking',
    # Payment
    'validate_payment_amount',
    'validate_payment_status',
    'validate_duplicate_payment',
    'validate_cash_confirmation',
    'validate_razorpay_signature',
    'validate_invoice_payment',
    # Invoice
    'validate_labour_charge',
    'validate_spare_part',
    'validate_quantity',
    'validate_unit_price',
    'validate_invoice_total',
    'validate_invoice_lock',
    # Chat
    'validate_chat_access',
    'validate_booking_chat',
    'validate_sender',
    'validate_receiver',
    'validate_message',
    # WebSocket
    'validate_socket_user',
    'validate_socket_booking',
    'validate_room',
    'validate_group',
    'validate_connection',
    # Notification
    'validate_notification_receiver',
    'validate_notification_type',
    'validate_duplicate_notification',
    # Email
    'validate_email',
    'validate_verification_token',
    'validate_reset_token',
    'validate_smtp',
    # OCR
    'validate_aadhaar',
    'validate_pan',
    'validate_document_fields',
    'validate_document_match',
]
