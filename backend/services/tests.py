from django.test import TestCase
from services.models import ServiceCategory, SystemSetting

class ServiceCategoryModelTest(TestCase):
    def setUp(self):
        self.category = ServiceCategory.objects.create(
            name="Electrician",
            description="Electrical repairs and setup",
            base_labour_charge=250.00
        )

    def test_service_category_str(self):
        self.assertEqual(str(self.category), "Electrician")

class SystemSettingModelTest(TestCase):
    def setUp(self):
        self.setting = SystemSetting.objects.create(
            company_name="Workizo Services",
            gst_percentage=18.00
        )

    def test_system_setting_str(self):
        self.assertEqual(str(self.setting), "Workizo Services")
