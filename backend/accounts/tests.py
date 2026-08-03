from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from services.models import ServiceCategory
from workers.models import WorkerProfile

User = get_user_model()

class AuthAPITests(APITestCase):
    def setUp(self):
        # Create categories for tests
        self.category = ServiceCategory.objects.create(name="Electrician")
        
        # Admin account
        self.admin_user = User.objects.create_superuser(
            email="admin@workizo.com",
            full_name="System Admin",
            phone="9876543210",
            password="adminpassword"
        )
        
        # URLs
        self.register_url = reverse('register')
        self.login_url = reverse('login')
        self.me_url = reverse('current_user')
        self.profile_url = reverse('update_profile')

    def test_customer_registration_and_login(self):
        # 1. Register Customer
        reg_data = {
            "email": "customer@test.com",
            "full_name": "Test Customer",
            "phone": "9999988888",
            "password": "customerpass",
            "role": "customer"
        }
        res = self.client.post(self.register_url, reg_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['email'], "customer@test.com")
        self.assertIn('access', res.data)
        
        # 2. Login
        login_data = {
            "email": "customer@test.com",
            "password": "customerpass"
        }
        res = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertEqual(res.data['user']['role'], 'customer')

    def test_worker_profile_flow_and_admin_verification(self):
        # 1. Register Worker
        reg_data = {
            "email": "worker@test.com",
            "full_name": "Test Worker",
            "phone": "9999977777",
            "password": "workerpassword",
            "role": "worker"
        }
        res = self.client.post(self.register_url, reg_data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        
        # 2. Access me (unauthenticated check)
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # 3. Authenticate as Worker
        login_res = self.client.post(self.login_url, {"email": "worker@test.com", "password": "workerpassword"}, format='json')
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + token)
        
        # 4. Fill worker profile details
        profile_url = reverse('register_profile')
        profile_data = {
            "experience": 5,
            "address": "123 Street",
            "city": "Mumbai",
            "state": "Maharashtra",
            "pincode": "400001",
            "aadhaar_number": "123412341234",
            "pan_number": "ABCDE1234F",
            "bank_account": "9876543210123",
            "ifsc_code": "SBIN0001234",
            "service_category_id": self.category.id
        }
        res = self.client.post(profile_url, profile_data, format='multipart')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['profile']['experience'], 5)
        self.assertEqual(res.data['profile']['approval_status'], 'pending')
        
        # 5. Admin Log In & Verification
        self.client.credentials() # clear auth
        admin_login_res = self.client.post(self.login_url, {"email": "admin@workizo.com", "password": "adminpassword"}, format='json')
        admin_token = admin_login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + admin_token)
        
        worker_user = User.objects.get(email="worker@test.com")
        verify_url = reverse('admin_verify_worker', kwargs={'pk': worker_user.id})
        
        res = self.client.post(verify_url, {"approval_status": "approved"}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['profile']['approval_status'], 'approved')
        self.assertEqual(res.data['profile']['is_verified'], True)

    def test_google_login_new_customer(self):
        google_login_url = reverse('google_login')
        mock_token = "mock_token_customer_newgoogle@test.com_Google-Customer-User"
        
        payload = {
            "credential": mock_token,
            "role": "customer"
        }
        res = self.client.post(google_login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['email'], "newgoogle@test.com")
        self.assertEqual(res.data['user']['role'], "customer")
        self.assertEqual(res.data['user']['auth_provider'], "GOOGLE")
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        
        user = User.objects.get(email="newgoogle@test.com")
        self.assertTrue(hasattr(user, 'customer_profile'))

    def test_google_login_new_worker(self):
        google_login_url = reverse('google_login')
        mock_token = "mock_token_worker_newworkergoogle@test.com_Google-Worker-User"
        
        payload = {
            "credential": mock_token,
            "role": "worker"
        }
        res = self.client.post(google_login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user']['email'], "newworkergoogle@test.com")
        self.assertEqual(res.data['user']['role'], "worker")
        self.assertEqual(res.data['user']['auth_provider'], "GOOGLE")
        self.assertIn('access', res.data)
        
        user = User.objects.get(email="newworkergoogle@test.com")
        self.assertTrue(hasattr(user, 'worker_profile'))
        self.assertEqual(user.worker_profile.approval_status, 'pending')

    def test_google_login_existing_user_link(self):
        existing_user = User.objects.create_user(
            email="existing@test.com",
            full_name="Existing Email User",
            phone="9191919191",
            password="somepassword",
            role="customer"
        )
        
        google_login_url = reverse('google_login')
        mock_token = "mock_token_customer_existing@test.com_Google-Name"
        
        payload = {
            "credential": mock_token,
            "role": "customer"
        }
        res = self.client.post(google_login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['user']['email'], "existing@test.com")
        self.assertEqual(res.data['user']['auth_provider'], "EMAIL")
        self.assertEqual(res.data['user']['google_id'], "mock_google_id_existing@test.com")
        self.assertIn('access', res.data)
