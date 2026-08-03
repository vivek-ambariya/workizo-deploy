from django.test import TestCase
from django.contrib.auth import get_user_model
from services.models import ServiceCategory
from bookings.models import Booking
from billing.models import Bill, Payment
from workers.models import WorkerProfile, Wallet, WalletTransaction
from rest_framework.test import APIClient
from rest_framework import status
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

class PaymentWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Setup service category
        self.category = ServiceCategory.objects.create(name="Plumber")
        
        # Setup users
        self.customer = User.objects.create_user(
            email="cust@workizo.com",
            full_name="Customer User",
            phone="9000000001",
            password="password123",
            role="customer"
        )
        self.captain = User.objects.create_user(
            email="worker@workizo.com",
            full_name="Captain User",
            phone="9000000002",
            password="password123",
            role="worker"
        )
        self.other_captain = User.objects.create_user(
            email="other_worker@workizo.com",
            full_name="Other Captain User",
            phone="9000000003",
            password="password123",
            role="worker"
        )
        
        # Worker profile
        self.profile = WorkerProfile.objects.create(
            user=self.captain,
            service_category=self.category,
            approval_status="approved",
            online_status=True
        )
        
        # Create booking
        self.booking = Booking.objects.create(
            customer=self.customer,
            worker=self.captain,
            service_category=self.category,
            problem_type="Leakage",
            problem_description="Tap leaks",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="repair_completed"
        )
        
        # Create bill
        self.bill = Bill.objects.create(
            booking=self.booking,
            labour_charges=Decimal('500.00'),
            parts_charges=Decimal('200.00'),
            gst=Decimal('126.00'),
            discount=Decimal('50.00'),
            grand_total=Decimal('776.00'),
            is_approved=True
        )

    def test_initiate_online_payment(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/billing/{self.booking.id}/initiate-online-payment/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('order_id', res.data)
        self.assertEqual(res.data['amount'], 77600) # paise
        
        # Verify payment record in DB
        payment = Payment.objects.get(booking=self.booking)
        self.assertEqual(payment.status, 'PENDING')
        self.assertEqual(payment.method, 'ONLINE')

    def test_verify_online_payment_success(self):
        # Create pending payment
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.captain,
            amount=Decimal('776.00'),
            method='ONLINE',
            status='PENDING',
            razorpay_order_id="order_mock_123"
        )
        
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/billing/{self.booking.id}/verify-online-payment/', {
            "razorpay_payment_id": "pay_mock_123",
            "razorpay_order_id": "order_mock_123",
            "razorpay_signature": "sig_mock_123"
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Refresh models
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(self.booking.status, 'ready_to_complete')

        # Wallet balance should still be 0 before captain completes job
        wallet = Wallet.objects.get(worker=self.captain)
        self.assertEqual(wallet.current_balance, 0)

        # Authenticate assigned captain to complete the job
        self.client.force_authenticate(user=self.captain)
        res_complete = self.client.post(f'/api/bookings/bookings/{self.booking.id}/update-status/', {
            "status": "completed"
        })
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'completed')
        
        # Verify wallet payouts
        wallet.refresh_from_db()
        expected_payout = Decimal('776.00') * Decimal('0.90')
        self.assertAlmostEqual(wallet.current_balance, expected_payout)
        
        # Verify transaction log
        log = WalletTransaction.objects.filter(wallet=wallet).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.amount, expected_payout.quantize(Decimal('0.01')))

    def test_verify_online_payment_failure(self):
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.captain,
            amount=Decimal('776.00'),
            method='ONLINE',
            status='PENDING',
            razorpay_order_id="order_mock_123"
        )
        
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/billing/{self.booking.id}/verify-online-payment/', {
            "status": "FAILED",
            "razorpay_order_id": "order_mock_123"
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'FAILED')
        
    def test_select_cash_payment(self):
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/billing/{self.booking.id}/select-cash-payment/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        payment = Payment.objects.get(booking=self.booking)
        self.booking.refresh_from_db()
        
        self.assertEqual(payment.method, 'CASH')
        self.assertEqual(payment.status, 'WAITING_FOR_CASH_CONFIRMATION')
        self.assertEqual(self.booking.status, 'WAITING_FOR_CASH_CONFIRMATION')

    def test_captain_cash_confirmation_success(self):
        # Create cash pending payment
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.captain,
            amount=Decimal('776.00'),
            method='CASH',
            status='WAITING_FOR_CASH_CONFIRMATION'
        )
        self.booking.status = 'WAITING_FOR_CASH_CONFIRMATION'
        self.booking.save()
        
        # Authenticate assigned captain
        self.client.force_authenticate(user=self.captain)
        res = self.client.post(f'/api/billing/{self.booking.id}/confirm-cash-payment/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        payment.refresh_from_db()
        self.booking.refresh_from_db()
        
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(self.booking.status, 'ready_to_complete')

        # Wallet balance should still be 0 before captain completes job
        wallet = Wallet.objects.get(worker=self.captain)
        self.assertEqual(wallet.current_balance, 0)

        # Authenticate assigned captain to complete the job
        res_complete = self.client.post(f'/api/bookings/bookings/{self.booking.id}/update-status/', {
            "status": "completed"
        })
        self.assertEqual(res_complete.status_code, status.HTTP_200_OK)

        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'completed')
        
        wallet.refresh_from_db()
        self.assertGreater(wallet.current_balance, 0)

    def test_captain_cash_confirmation_unauthorized(self):
        Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.captain,
            amount=Decimal('776.00'),
            method='CASH',
            status='WAITING_FOR_CASH_CONFIRMATION'
        )
        self.booking.status = 'WAITING_FOR_CASH_CONFIRMATION'
        self.booking.save()
        
        # Authenticate other captain
        self.client.force_authenticate(user=self.other_captain)
        res = self.client.post(f'/api/billing/{self.booking.id}/confirm-cash-payment/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_double_payment_prevention(self):
        payment = Payment.objects.create(
            booking=self.booking,
            customer=self.customer,
            captain=self.captain,
            amount=Decimal('776.00'),
            method='ONLINE',
            status='PAID'
        )
        self.booking.status = 'completed'
        self.booking.save()
        
        self.client.force_authenticate(user=self.customer)
        res = self.client.post(f'/api/billing/{self.booking.id}/initiate-online-payment/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bill_generation_negative_labour_charges(self):
        self.client.force_authenticate(user=self.captain)
        # Delete default setup bill to avoid duplicate bill generation checks
        self.bill.delete()
        res = self.client.post(f'/api/billing/{self.booking.id}/generate-bill/', {
            "labour_charges": -50,
            "discount": 0
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Labour charges cannot be negative.", res.data.get("detail", ""))

    def test_bill_generation_negative_discount(self):
        self.client.force_authenticate(user=self.captain)
        self.bill.delete()
        res = self.client.post(f'/api/billing/{self.booking.id}/generate-bill/', {
            "labour_charges": 100,
            "discount": -10
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Discount cannot be negative.", res.data.get("detail", ""))

    def test_bill_generation_invalid_part_quantity(self):
        self.client.force_authenticate(user=self.captain)
        self.bill.delete()
        res = self.client.post(f'/api/billing/{self.booking.id}/generate-bill/', {
            "labour_charges": 100,
            "discount": 0,
            "items": [{"part_name": "Pipe", "quantity": 0, "price": 50}]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Spare part quantity must be at least 1.", res.data.get("detail", ""))

    def test_bill_generation_negative_part_price(self):
        self.client.force_authenticate(user=self.captain)
        self.bill.delete()
        res = self.client.post(f'/api/billing/{self.booking.id}/generate-bill/', {
            "labour_charges": 100,
            "discount": 0,
            "items": [{"part_name": "Pipe", "quantity": 2, "price": -50}]
        }, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Spare part price cannot be negative.", res.data.get("detail", ""))

    def test_double_bill_approval_prevention(self):
        self.client.force_authenticate(user=self.customer)
        # First approval succeeds
        self.bill.is_approved = False
        self.bill.save()
        res = self.client.post(f'/api/billing/{self.booking.id}/approve-bill/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        
        # Second approval fails
        res = self.client.post(f'/api/billing/{self.booking.id}/approve-bill/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("This bill is already approved.", res.data.get("detail", ""))

    def test_unapproved_bill_payment_prevention(self):
        self.client.force_authenticate(user=self.customer)
        self.bill.is_approved = False
        self.bill.save()
        res = self.client.post(f'/api/billing/{self.booking.id}/initiate-online-payment/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Bill invoice must be approved by customer before initiating payment.", res.data.get("detail", ""))

