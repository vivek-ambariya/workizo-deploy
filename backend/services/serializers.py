from rest_framework import serializers
from services.models import ServiceCategory, SystemSetting

class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ('id', 'name', 'is_active', 'description', 'icon', 'base_labour_charge')

class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = (
            'id', 'company_name', 'company_logo', 'contact_details',
            'gst_percentage', 'support_email', 'support_phone',
            'terms_conditions', 'privacy_policy'
        )
