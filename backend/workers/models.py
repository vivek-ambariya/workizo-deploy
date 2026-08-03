from django.db import models
from django.conf import settings
from services.models import ServiceCategory

class WorkerProfile(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    objects = models.Manager()

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='worker_profile')
    service_category = models.ForeignKey(ServiceCategory, on_delete=models.SET_NULL, null=True, related_name='workers')
    experience = models.IntegerField(default=0)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    
    aadhaar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    dob = models.CharField(max_length=50, blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    father_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account = models.CharField(max_length=20, blank=True, null=True)
    ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    
    profile_photo = models.ImageField(upload_to='worker_photos/profile/', blank=True, null=True)
    aadhaar_photo = models.ImageField(upload_to='worker_photos/aadhaar/', blank=True, null=True)
    pan_photo = models.ImageField(upload_to='worker_photos/pan/', blank=True, null=True)
    
    AVAILABILITY_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('BUSY', 'Busy'),
    )

    is_verified = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    online_status = models.BooleanField(default=False)
    availability_status = models.CharField(max_length=20, choices=AVAILABILITY_CHOICES, default='AVAILABLE')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def is_currently_available(self):
        return (
            self.online_status
            and self.approval_status == 'approved'
            and self.availability_status == 'AVAILABLE'
        )

    def __str__(self):
        return f"Worker Profile for {self.user.email} ({self.availability_status})"

class Wallet(models.Model):
    objects = models.Manager()

    worker = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wallet')
    current_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    pending_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet for {self.worker.email} - Balance: ₹{self.current_balance}"

class WalletTransaction(models.Model):
    TYPE_CHOICES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    )

    objects = models.Manager()

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wallet Txn #{self.id} - {self.transaction_type.upper()} ₹{self.amount} for {self.wallet.worker.email}"

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_worker_wallet(sender, instance, created, **kwargs):
    if instance.role == 'worker':
        Wallet.objects.get_or_create(worker=instance)
