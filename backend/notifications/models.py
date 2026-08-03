from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='general')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.user.email} - {self.title} (Read: {self.is_read})"

class Announcement(models.Model):
    RECIPIENT_CHOICES = (
        ('all_customers', 'All Customers'),
        ('all_captains', 'All Captains'),
        ('individual_customer', 'Individual Customer'),
        ('individual_captain', 'Individual Captain'),
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    recipient_type = models.CharField(max_length=50, choices=RECIPIENT_CHOICES)
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_announcements')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.title} to {self.recipient_type}"
