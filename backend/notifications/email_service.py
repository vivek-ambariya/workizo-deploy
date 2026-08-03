from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.signing import TimestampSigner
from django.conf import settings

from notifications.utils import send_html_email

class EmailNotificationService:
    @staticmethod
    def _get_base_url(request=None):
        if request:
            # e.g., http://localhost:8000 or http://127.0.0.1:8000
            scheme = 'https' if request.is_secure() else 'http'
            return f"{scheme}://{request.get_host()}"
        return "http://localhost:8000"

    @staticmethod
    def send_welcome_verification_email(user, request=None):
        """
        Sends a welcome email containing a secure verification link that expires in 24 hours.
        """
        signer = TimestampSigner()
        token = signer.sign(str(user.id))
        
        base_url = EmailNotificationService._get_base_url(request)
        verification_url = f"{base_url}/api/accounts/verify-email/?token={token}"
        
        context = {
            'subject': 'Welcome to WORKIZO! Verify your email address',
            'user_name': user.full_name,
            'verification_url': verification_url,
            'expire_hours': 24
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/welcome_verification.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_password_reset_email(user, request=None):
        """
        Sends a password reset email with a link that expires in 15 minutes.
        """
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        
        base_url = EmailNotificationService._get_base_url(request)
        reset_url = f"{base_url}/api/accounts/reset-password/{uidb64}/{token}/"
        
        context = {
            'subject': 'Reset your WORKIZO Password',
            'user_name': user.full_name,
            'reset_url': reset_url
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/forgot_password.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_booking_confirmation_email(booking):
        """
        Sends an email confirming that the customer's booking was successfully created.
        """
        formatted_date = booking.created_at.strftime("%B %d, %Y at %I:%M %p") if booking.created_at else "Now"
        
        context = {
            'subject': f"Booking Placed successfully - {booking.tracking_id}",
            'user_name': booking.customer.full_name,
            'booking_id': booking.id,
            'tracking_id': booking.tracking_id or f"WRK-{booking.id + 10000}",
            'service_category': booking.service_category.name,
            'service_address': f"{booking.address}, {booking.city}, {booking.state} - {booking.pincode}",
            'booking_date': formatted_date,
            'payment_mode': "Post-service Payment",
            'current_status': booking.get_status_display()
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/booking_confirmation.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_captain_assigned_email(booking):
        """
        Sends an email notifying the customer that a captain is assigned.
        """
        if not booking.worker:
            return False
            
        context = {
            'subject': f"Captain Assigned for Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'captain_name': booking.worker.full_name,
            'captain_phone': booking.worker.phone or "N/A",
            'booking_id': booking.id,
            'service_category': booking.service_category.name,
            'current_status': booking.get_status_display()
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_assigned.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_captain_arrived_email(booking):
        """
        Sends an email notifying the customer that the captain has arrived.
        """
        if not booking.worker:
            return False

        context = {
            'subject': f"Captain Arrived - Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'captain_name': booking.worker.full_name,
            'booking_id': booking.id
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_arrived.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_work_started_email(booking):
        """
        Sends an email notifying the customer that repair/service has started.
        """
        if not booking.worker:
            return False

        context = {
            'subject': f"Work In Progress - Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'captain_name': booking.worker.full_name,
            'booking_id': booking.id
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/work_started.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def _get_frontend_url(request=None):
        if getattr(settings, 'CORS_ALLOWED_ORIGINS', None) and len(settings.CORS_ALLOWED_ORIGINS) > 0:
            return settings.CORS_ALLOWED_ORIGINS[0].rstrip('/')
        return "http://localhost:5173"

    @staticmethod
    def send_work_completed_email(booking, bill):
        """
        Sends an email notifying the customer that work is completed and includes invoice summary.
        """
        payment_status = "Paid" if bill.grand_total == 0 else "Pending Customer Approval"
        frontend_base = EmailNotificationService._get_frontend_url()
        
        context = {
            'subject': f"Work Completed & Bill Generated - Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'booking_id': booking.id,
            'booking_summary': f"{booking.service_category.name} - {booking.problem_type}",
            'bill_amount': bill.grand_total,
            'payment_status': payment_status,
            'payment_url': f"{frontend_base}/customer/booking/{booking.id}"
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/work_completed.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_payment_receipt_email(booking, payment):
        """
        Sends payment receipt/confirmation to the customer.
        """
        context = {
            'subject': f"Payment Receipt for Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'booking_id': booking.id,
            'invoice_number': getattr(booking.bill, 'id', booking.id),
            'amount_paid': payment.amount,
            'payment_method': payment.get_method_display(),
            'transaction_id': payment.transaction_id
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/payment_receipt.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_booking_cancelled_email(booking, reason=None):
        """
        Sends a cancellation notification to the customer.
        """
        context = {
            'subject': f"Booking Cancelled - Booking #{booking.id}",
            'user_name': booking.customer.full_name,
            'booking_id': booking.id,
            'cancellation_reason': reason
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/booking_cancelled.html',
            context=context,
            recipient_list=[booking.customer.email]
        )

    @staticmethod
    def send_captain_welcome_verification_email(user, request=None):
        """
        Sends a welcome email containing a secure verification link that expires in 24 hours to a captain.
        """
        signer = TimestampSigner()
        token = signer.sign(str(user.id))
        
        base_url = EmailNotificationService._get_base_url(request)
        verification_url = f"{base_url}/api/accounts/verify-email/?token={token}"
        
        context = {
            'subject': 'Welcome to WORKIZO! Verify your Captain account',
            'user_name': user.full_name,
            'verification_url': verification_url,
            'expire_hours': 24
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_welcome_verification.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_captain_kyc_submitted_email(user):
        """
        Sends an email confirming KYC document receipt.
        """
        context = {
            'subject': 'KYC Verification Documents Received',
            'user_name': user.full_name
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_kyc_submitted.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_captain_kyc_approved_email(user):
        """
        Sends an email notifying the captain that they have been approved.
        """
        context = {
            'subject': 'Congratulations! Your Captain account is verified',
            'user_name': user.full_name
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_kyc_approved.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_captain_kyc_rejected_email(user, reason=None):
        """
        Sends an email notifying the captain that their KYC has been rejected.
        """
        context = {
            'subject': 'Action Required: Captain Verification Update',
            'user_name': user.full_name,
            'rejection_reason': reason
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_kyc_rejected.html',
            context=context,
            recipient_list=[user.email]
        )

    @staticmethod
    def send_captain_booking_assigned_email(booking):
        """
        Sends an email containing details of the booking accepted by the captain.
        """
        if not booking.worker:
            return False

        context = {
            'subject': f"New Job Accepted - Booking #{booking.id}",
            'user_name': booking.worker.full_name,
            'booking_id': booking.id,
            'customer_name': booking.customer.full_name,
            'customer_phone': booking.customer.phone or "N/A",
            'service_category': booking.service_category.name,
            'service_address': f"{booking.address}, {booking.city}, {booking.state} - {booking.pincode}",
            'current_status': booking.get_status_display()
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_booking_assigned.html',
            context=context,
            recipient_list=[booking.worker.email]
        )

    @staticmethod
    def send_captain_booking_cancelled_email(booking, reason=None):
        """
        Sends a cancellation notification to the captain.
        """
        if not booking.worker:
            return False

        context = {
            'subject': f"Job Cancelled - Booking #{booking.id}",
            'user_name': booking.worker.full_name,
            'booking_id': booking.id,
            'cancellation_reason': reason
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_booking_cancelled.html',
            context=context,
            recipient_list=[booking.worker.email]
        )

    @staticmethod
    def send_captain_service_completed_email(booking):
        """
        Sends a service completion summary to the captain.
        """
        if not booking.worker:
            return False

        from django.utils.timezone import now
        formatted_time = now().strftime("%B %d, %Y at %I:%M %p")

        context = {
            'subject': f"Job Completed Summary - Booking #{booking.id}",
            'user_name': booking.worker.full_name,
            'booking_id': booking.id,
            'customer_name': booking.customer.full_name,
            'completion_time': formatted_time
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/captain_service_completed.html',
            context=context,
            recipient_list=[booking.worker.email]
        )

    @staticmethod
    def send_captain_payment_confirmation_email(booking, payment):
        """
        Sends a payment confirmation email to the captain.
        """
        if not booking.worker:
            return False

        context = {
            'subject': f"Payment Confirmed - Booking #{booking.id}",
            'user_name': booking.worker.full_name,
            'booking_id': booking.id,
            'customer_name': booking.customer.full_name,
            'amount_paid': payment.amount,
            'payment_method': payment.get_method_display(),
            'payment_time': payment.payment_time.strftime("%B %d, %Y at %I:%M %p") if payment.payment_time else "",
            'transaction_id': payment.transaction_id or ""
        }
        
        return send_html_email(
            subject=context['subject'],
            template_name='emails/payment_confirmation_captain.html',
            context=context,
            recipient_list=[booking.worker.email]
        )


