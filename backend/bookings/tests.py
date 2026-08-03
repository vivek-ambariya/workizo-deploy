from django.test import TestCase
from django.contrib.auth import get_user_model
from services.models import ServiceCategory
from workers.models import WorkerProfile
from bookings.models import Booking, BookingRejection
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class BookingRejectionTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create category
        self.category = ServiceCategory.objects.create(name="Plumber")
        
        # Create customer
        self.customer = User.objects.create_user(
            email="cust@workizo.com",
            full_name="Cust Patel",
            phone="9000000001",
            password="password123",
            role="customer"
        )
        
        # Create worker
        self.worker_user = User.objects.create_user(
            email="worker@workizo.com",
            full_name="Worker Dave",
            phone="9000000002",
            password="password123",
            role="worker"
        )
        
        # Setup worker profile
        self.profile = WorkerProfile.objects.create(
            user=self.worker_user,
            service_category=self.category,
            approval_status="approved",
            online_status=True
        )
        
        # Create bookings
        self.booking1 = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Leakage",
            problem_description="Tap leaks",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="searching"
        )
        
        self.booking2 = Booking.objects.create(
            customer=self.customer,
            service_category=self.category,
            problem_type="Pipe broke",
            problem_description="Pipe leaks",
            address="Vastrapur",
            city="Ahmedabad",
            state="Gujarat",
            pincode="380015",
            status="searching"
        )
        
        self.client.force_authenticate(user=self.worker_user)

    def test_available_requests_excludes_rejected(self):
        # Initial check: both bookings should show up
        res = self.client.get('/api/bookings/bookings/available-requests/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        
        # Reject first booking
        reject_res = self.client.post(f'/api/bookings/bookings/{self.booking1.id}/reject/')
        self.assertEqual(reject_res.status_code, status.HTTP_200_OK)
        
        # Verify first is excluded, only second is returned
        res = self.client.get('/api/bookings/bookings/available-requests/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['id'], self.booking2.id)


