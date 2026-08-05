import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Booking(models.Model):
    STATUS_CHOICES = (
        ('searching', 'Searching For Worker'),
        ('accepted', 'Worker Accepted'),
        ('on_the_way', 'Worker On The Way'),
        ('arrived', 'Worker Arrived'),
        ('verified', 'QR Verified'),
        ('inspection', 'Inspection'),
        ('repair_started', 'Repair Started'),
        ('repair_completed', 'Repair Completed'),
        ('waiting_approval', 'Waiting For Customer Approval'),
        ('WAITING_FOR_CASH_CONFIRMATION', 'Waiting For Cash Confirmation'),
        ('ready_to_complete', 'Ready To Complete'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    worker = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    service_category = models.ForeignKey('services.ServiceCategory', on_delete=models.PROTECT)
    problem_type = models.CharField(max_length=100)
    problem_description = models.TextField()
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=10)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='searching')
    qr_code_value = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    tracking_id = models.CharField(max_length=50, unique=True, null=True, blank=True)
    before_photo = models.ImageField(upload_to='bookings/before/', null=True, blank=True)
    after_photo = models.ImageField(upload_to='bookings/after/', null=True, blank=True)
    spare_part_photo = models.ImageField(upload_to='bookings/parts/', null=True, blank=True)
    invoice_photo = models.ImageField(upload_to='bookings/invoices/', null=True, blank=True)
    optional_video = models.FileField(upload_to='bookings/videos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and not self.tracking_id:
            self.tracking_id = f"WRK-{self.id + 10000}"
            try:
                super().save(update_fields=['tracking_id', 'updated_at'])
            except Exception:
                pass

    def __str__(self):
        return f"Booking #{self.id} - {self.service_category.name} ({self.status})"

class RepairToken(models.Model):
    STATUS_CHOICES = (
        ('item_received', 'Item Received'),
        ('reached_workshop', 'Reached Workshop'),
        ('inspection', 'Inspection'),
        ('repair_started', 'Repair Started'),
        ('waiting_parts', 'Waiting For Parts'),
        ('repair_completed', 'Repair Completed'),
        ('returning', 'Returning'),
        ('delivered', 'Delivered'),
    )

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='repair_token')
    token_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='item_received')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Token {self.token_number} ({self.status})"

class MajorRepairApproval(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='major_repairs')
    reason = models.TextField()
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Repair Approval #{self.id} for Booking #{self.booking.id} ({self.status})"

class BookingRejection(models.Model):
    worker = models.ForeignKey(User, on_delete=models.CASCADE, related_name='booking_rejections')
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='booking_rejections')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('worker', 'booking')

    def __str__(self):
        return f"Rejection by {self.worker.email} for Booking #{self.booking.id}"

class ChatMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='chat_messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    message_type = models.CharField(max_length=20, default='text')

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Msg {self.id} from {self.sender.email} to {self.receiver.email} for Booking {self.booking.id}"


