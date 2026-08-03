from rest_framework import serializers
from customers.models import CustomerProfile

class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = ('address', 'city', 'state', 'pincode')
