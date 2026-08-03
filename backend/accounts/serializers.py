from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'phone', 'role', 'profile_photo', 'google_id', 'profile_picture', 'auth_provider', 'is_active', 'is_email_verified', 'created_at')
        read_only_fields = ('id', 'role', 'is_active', 'is_email_verified', 'created_at')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ('id', 'full_name', 'email', 'phone', 'password', 'role')
        extra_kwargs = {
            'full_name': {'required': True},
            'phone': {'required': True},
        }

    def validate_role(self, value):
        if value not in ['customer', 'worker']:
            raise serializers.ValidationError("Role must be 'customer' or 'worker'")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            full_name=validated_data['full_name'],
            phone=validated_data['phone'],
            password=validated_data['password'],
            role=validated_data['role']
        )
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = user.full_name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user_data = UserSerializer(self.user).data
        profile_data = None
        if self.user.role == 'customer':
            try:
                from customers.models import CustomerProfile
                from customers.serializers import CustomerProfileSerializer
                profile = CustomerProfile.objects.filter(user=self.user).first()
                if profile:
                    profile_data = CustomerProfileSerializer(profile).data
            except Exception:
                pass
        elif self.user.role == 'worker':
            try:
                from workers.models import WorkerProfile
                from workers.serializers import WorkerProfileSerializer
                profile = WorkerProfile.objects.filter(user=self.user).select_related('service_category').first()
                if profile:
                    profile_data = WorkerProfileSerializer(profile).data
            except Exception:
                pass
        
        user_data['profile'] = profile_data
        data['user'] = user_data
        
        print(f"\n================ [DEBUG] ACCESS TOKEN ({self.user.email}) ================")
        print(data['access'])
        print("========================================================================\n")
        
        return data
