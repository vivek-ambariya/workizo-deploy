from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from services.models import ServiceCategory
from workers.models import WorkerProfile
from django.core.files.uploadedfile import SimpleUploadedFile

User = get_user_model()

class WorkerProfileRegistrationTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = ServiceCategory.objects.create(name="Plumber")
        self.worker_user = User.objects.create_user(
            email="worker@workizo.com",
            full_name="Worker Dave",
            phone="9000000002",
            password="password123",
            role="worker"
        )
        self.client.force_authenticate(user=self.worker_user)

    def test_register_profile_success(self):
        # Create a mock image file
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        profile_photo = SimpleUploadedFile('profile.gif', small_gif, content_type='image/gif')
        aadhaar_photo = SimpleUploadedFile('aadhaar.gif', small_gif, content_type='image/gif')
        pan_photo = SimpleUploadedFile('pan.gif', small_gif, content_type='image/gif')

        data = {
            'full_name': 'Worker Dave Updated',
            'phone': '9000000003',
            'experience': 5,
            'address': '123 Test St',
            'city': 'Ahmedabad',
            'state': 'Gujarat',
            'pincode': '380015',
            'aadhaar_number': '123456789012',
            'pan_number': 'ABCDE1234F',
            'bank_account': '9876543210',
            'ifsc_code': 'SBIN0000001',
            'service_category_id': self.category.id,
            'profile_photo': profile_photo,
            'aadhaar_photo': aadhaar_photo,
            'pan_photo': pan_photo,
        }
        response = self.client.post('/api/workers/register-profile/', data, format='multipart')
        print("TEST RESPONSE STATUS:", response.status_code)
        print("TEST RESPONSE DATA:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify user fields are updated in database
        self.worker_user.refresh_from_db()
        self.assertEqual(self.worker_user.full_name, 'Worker Dave Updated')
        self.assertEqual(self.worker_user.phone, '9000000003')

    def test_ocr_extract_aadhaar_mock(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        mock_aadhaar_file = SimpleUploadedFile('mock_aadhaar.gif', small_gif, content_type='image/gif')
        data = {
            'document': mock_aadhaar_file
        }
        response = self.client.post('/api/ocr/extract-document/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_type'], 'AADHAAR')
        self.assertEqual(response.data['aadhaar_number'], '123456789012')
        self.assertEqual(response.data['name'], 'Mock Captain User')
        
    def test_ocr_extract_pan_mock(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        mock_pan_file = SimpleUploadedFile('mock_pan.gif', small_gif, content_type='image/gif')
        data = {
            'document': mock_pan_file
        }
        response = self.client.post('/api/ocr/extract-document/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['document_type'], 'PAN')
        self.assertEqual(response.data['pan_number'], 'ABCDE1234F')
        self.assertEqual(response.data['name'], 'Mock Captain User')
        self.assertEqual(response.data['father_name'], 'Mock Father Name')
        
    def test_ocr_unsupported_document(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        invalid_file = SimpleUploadedFile('invalid_file.gif', small_gif, content_type='image/gif')
        data = {
            'document': invalid_file
        }
        response = self.client.post('/api/ocr/extract-document/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Unsupported document.')

    def test_ocr_extract_aadhaar_invalid(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        invalid_aadhaar_file = SimpleUploadedFile('mock_aadhaar_invalid.gif', small_gif, content_type='image/gif')
        data = {
            'document': invalid_aadhaar_file
        }
        response = self.client.post('/api/ocr/extract-document/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Invalid Aadhaar Card. Please upload a clear and valid Aadhaar Card.')

    def test_ocr_extract_pan_invalid(self):
        small_gif = (
            b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x00\x00\x00\x21\xf9\x04'
            b'\x01\x0a\x00\x01\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02'
            b'\x02\x4c\x01\x00\x3b'
        )
        invalid_pan_file = SimpleUploadedFile('mock_pan_invalid.gif', small_gif, content_type='image/gif')
        data = {
            'document': invalid_pan_file
        }
        response = self.client.post('/api/ocr/extract-document/', data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['detail'], 'Invalid PAN Card. Please upload a clear and valid PAN Card.')
