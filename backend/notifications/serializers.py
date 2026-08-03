from rest_framework import serializers
from .models import Notification, Announcement

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'user', 'title', 'message', 'notification_type', 'is_read', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class AnnouncementSerializer(serializers.ModelSerializer):
    recipient_user_name = serializers.CharField(source='recipient_user.full_name', read_only=True, default=None)
    
    class Meta:
        model = Announcement
        fields = ('id', 'title', 'message', 'recipient_type', 'recipient_user', 'recipient_user_name', 'created_at')
        read_only_fields = ('id', 'created_at')
