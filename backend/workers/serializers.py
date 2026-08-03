from rest_framework import serializers
from workers.models import WorkerProfile, Wallet, WalletTransaction
from services.models import ServiceCategory
from services.serializers import ServiceCategorySerializer

class WorkerProfileSerializer(serializers.ModelSerializer):
    service_category_id = serializers.PrimaryKeyRelatedField(
        queryset=ServiceCategory.objects.all(),
        source='service_category',
        write_only=True,
        required=False,
        allow_null=True
    )
    service_category = ServiceCategorySerializer(read_only=True)
    
    class Meta:
        model = WorkerProfile
        fields = (
            'service_category',
            'service_category_id',
            'experience',
            'address',
            'city',
            'state',
            'pincode',
            'aadhaar_number',
            'pan_number',
            'dob',
            'gender',
            'father_name',
            'bank_account',
            'ifsc_code',
            'profile_photo',
            'aadhaar_photo',
            'pan_photo',
            'is_verified',
            'approval_status',
            'online_status',
            'availability_status',
            'is_currently_available'
        )
        read_only_fields = ('is_verified', 'approval_status', 'availability_status', 'is_currently_available')

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = ('id', 'wallet', 'amount', 'transaction_type', 'description', 'created_at')
        read_only_fields = ('id', 'created_at')

class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)

    class Meta:
        model = Wallet
        fields = ('id', 'worker', 'current_balance', 'pending_balance', 'transactions')
        read_only_fields = ('id', 'current_balance', 'pending_balance')
