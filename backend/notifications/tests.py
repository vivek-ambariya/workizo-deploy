from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.signing import TimestampSigner, SignatureExpired
from django.urls import reverse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from decimal import Decimal
from unittest.mock import patch

from bookings.models import Booking
from services.models import ServiceCategory
from billing.models import Bill, Payment
from notifications.email_service import EmailNotificationService

User = get_user_model()

class EmailSystemTests(TestCase):
    def setUp(self):
        # Create categories and users
        self.category = ServiceCategory.objects.create(
            name="Plumbing", 
            description="Plumbing services"
        )
        
        self.customer = User.objects.create_user(
            email="customer@example.com",
            full_name="John Customer",
            phone="+919999999999",
            password="customerpassword",
            role="customer"
        )
        
        self.worker = User.objects.create_user(
            email="worker@example.com",
            full_name="Captain Jack",
            phone="+918888888888",
            password="workerpassword",
            role="worker"
        )
        
        # Verify customer's profile is created
        from customers.models import CustomerProfile
        from workers.models import WorkerProfile
        CustomerProfile.objects.get_or_create(user=self.customer)
        self.worker_profile, _ = WorkerProfile.objects.get_or_create(
            user=self.worker,
            defaults={'service_category': self.category, 'approval_status': 'approved', 'online_status': True}
        )

    def test_registration_sends_verification_email(self):
        mail.outbox.clear()
        # Create a new user via the API
        url = reverse('register')
        data = {
            "email": "newuser@example.com",
            "full_name": "New User",
            "phone": "+917777777777",
            "password": "newuserpassword",
            "role": "customer"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
        
        # Assert verification email is in outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Welcome to WORKIZO", mail.outbox[0].subject)
        self.assertIn("newuser@example.com", mail.outbox[0].to)

    def test_email_verification_success(self):
        # Generate token for customer
        signer = TimestampSigner()
        token = signer.sign(str(self.customer.id))
        
        # Check initial verified state
        self.assertFalse(self.customer.is_email_verified)
        
        # Hit verification view
        url = reverse('verify_email') + f"?token={token}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Email Verified")
        
        # Reload user and check status
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_email_verified)

    def test_email_verification_invalid_or_expired(self):
        # Missing token
        url = reverse('verify_email')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "Verification Failed", status_code=400)

        # Invalid token
        url = reverse('verify_email') + "?token=invalidtoken123"
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)
        self.assertContains(response, "Invalid Link", status_code=400)
        
        # Expired token (using patch to simulate timestamp expiry)
        signer = TimestampSigner()
        token = signer.sign(str(self.customer.id))
        url = reverse('verify_email') + f"?token={token}"
        
        # Simulate expiry by mocking unsign to raise SignatureExpired
        with patch('django.core.signing.TimestampSigner.unsign', side_effect=SignatureExpired("expired")):
            response = self.client.get(url)
            self.assertEqual(response.status_code, 400)
            self.assertContains(response, "Verification Expired", status_code=400)

    def test_forgot_password_sends_email(self):
        mail.outbox.clear()
        url = reverse('forgot_password')
        data = {"email": "customer@example.com"}
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Reset your WORKIZO Password", mail.outbox[0].subject)
        
    def test_password_reset_confirm_flow(self):
        # Generate reset token
        uidb64 = urlsafe_base64_encode(force_bytes(self.customer.pk))
        token = default_token_generator.make_token(self.customer)
        
        # Render reset form (GET)
        url = reverse('password_reset_confirm', kwargs={'uidb64': uidb64, 'token': token})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Reset Password")
        
        # Confirm password change (POST)
        data = {
            "password": "newstrongpassword123",
            "confirm_password": "newstrongpassword123"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Password Reset Successful")
        
        # Verify user password updated and email verified
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.check_password("newstrongpassword123"))
        self.assertTrue(self.customer.is_email_verified)

    def test_booking_notifications_trigger_emails(self):
        # 1. Booking Confirmation (on booking creation)
        mail.outbox.clear()
        booking = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Leakage",
            problem_description="Kitchen pipe leaking",
            address="123 Street",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            status="searching"
        )
        # Booking creation triggers notification via perform_create hook.
        # Since we created it directly in database, we invoke the service explicitly or test via API.
        # Let's call the email service directly for the explicit checks:
        EmailNotificationService.send_booking_confirmation_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Booking Placed", mail.outbox[0].subject)
        
        # 2. Captain Assigned
        mail.outbox.clear()
        booking.worker = self.worker
        booking.status = "accepted"
        booking.save()
        EmailNotificationService.send_captain_assigned_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Captain Assigned", mail.outbox[0].subject)
        
        # 3. Captain Arrived
        mail.outbox.clear()
        booking.status = "arrived"
        booking.save()
        EmailNotificationService.send_captain_arrived_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Captain Arrived", mail.outbox[0].subject)

        # 4. Work Started
        mail.outbox.clear()
        booking.status = "repair_started"
        booking.save()
        EmailNotificationService.send_work_started_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Work In Progress", mail.outbox[0].subject)

        # 5. Work Completed (Bill generated)
        mail.outbox.clear()
        bill = Bill.objects.create(
            booking=booking,
            labour_charges=Decimal("300.00"),
            parts_charges=Decimal("100.00"),
            gst=Decimal("72.00"),
            grand_total=Decimal("472.00")
        )
        EmailNotificationService.send_work_completed_email(booking, bill)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Work Completed", mail.outbox[0].subject)
        self.assertIn("₹472.00", mail.outbox[0].body)

        # 6. Payment Receipt
        mail.outbox.clear()
        payment = Payment.objects.create(
            booking=booking,
            amount=Decimal("472.00"),
            method="upi",
            status="success",
            transaction_id="TXN-TEST-1234"
        )
        EmailNotificationService.send_payment_receipt_email(booking, payment)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Payment Receipt", mail.outbox[0].subject)
        self.assertIn("TXN-TEST-1234", mail.outbox[0].body)

        # 7. Booking Cancelled
        mail.outbox.clear()
        booking.status = "cancelled"
        booking.save()
        EmailNotificationService.send_booking_cancelled_email(booking, reason="Customer not available")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Booking Cancelled", mail.outbox[0].subject)
        self.assertIn("Customer not available", mail.outbox[0].body)

    def test_email_failures_dont_crash_app(self):
        # We mock send_mail / django.core.mail.EmailMultiAlternatives.send to fail.
        # The app should gracefully log the exception and return False without crashing.
        with patch('django.core.mail.EmailMultiAlternatives.send', side_effect=Exception("SMTP Connection Error")):
            result = EmailNotificationService.send_welcome_verification_email(self.customer)
            self.assertFalse(result) # Should return False on failure, but NOT raise an exception

    def test_captain_registration_and_verification_emails(self):
        mail.outbox.clear()
        # Create a new captain via Register API
        url = reverse('register')
        data = {
            "email": "newcaptain@example.com",
            "full_name": "New Captain",
            "phone": "+916666666666",
            "password": "captainpassword",
            "role": "worker"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
        
        # Assert welcome verification email is sent to captain
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Verify your Captain account", mail.outbox[0].subject)
        self.assertIn("newcaptain@example.com", mail.outbox[0].to)

    def test_captain_kyc_notifications(self):
        # 1. KYC Submitted
        mail.outbox.clear()
        EmailNotificationService.send_captain_kyc_submitted_email(self.worker)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("KYC Verification Documents Received", mail.outbox[0].subject)

        # 2. KYC Approved
        mail.outbox.clear()
        EmailNotificationService.send_captain_kyc_approved_email(self.worker)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Congratulations! Your Captain account is verified", mail.outbox[0].subject)

        # 3. KYC Rejected
        mail.outbox.clear()
        EmailNotificationService.send_captain_kyc_rejected_email(self.worker, reason="Aadhaar card blur")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Captain Verification Update", mail.outbox[0].subject)
        self.assertIn("Aadhaar card blur", mail.outbox[0].body)

    def test_captain_booking_notifications(self):
        booking = Booking.objects.create(
            customer=self.customer,
            worker=self.worker,
            service_category=self.category,
            problem_type="Leakage",
            problem_description="Kitchen pipe leaking",
            address="123 Street",
            city="Mumbai",
            state="Maharashtra",
            pincode="400001",
            status="accepted"
        )
        
        # 1. Booking Assigned
        mail.outbox.clear()
        EmailNotificationService.send_captain_booking_assigned_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("New Job Accepted", mail.outbox[0].subject)

        # 2. Booking Cancelled
        mail.outbox.clear()
        EmailNotificationService.send_captain_booking_cancelled_email(booking, reason="Customer cancelled")
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Job Cancelled", mail.outbox[0].subject)
        self.assertIn("Customer cancelled", mail.outbox[0].body)

        # 3. Service Completed
        mail.outbox.clear()
        EmailNotificationService.send_captain_service_completed_email(booking)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Job Completed Summary", mail.outbox[0].subject)
