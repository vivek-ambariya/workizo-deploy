from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True, null=True)
    base_labour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Rating(models.Model):
    booking = models.OneToOneField('bookings.Booking', on_delete=models.CASCADE, related_name='rating')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_ratings')
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_ratings')
    rating = models.IntegerField()
    review = models.TextField(blank=True, null=True)
    is_hidden = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Rating: {self.rating} stars for Worker {self.worker.email} by {self.customer.email}"

class SystemSetting(models.Model):
    company_name = models.CharField(max_length=100, default='Workizo')
    company_logo = models.ImageField(upload_to='settings/', blank=True, null=True)
    contact_details = models.TextField(blank=True, null=True)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    support_email = models.EmailField(default='support@workizo.com')
    support_phone = models.CharField(max_length=15, default='+919876543210')
    terms_conditions = models.TextField(blank=True, null=True)
    privacy_policy = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return self.company_name
