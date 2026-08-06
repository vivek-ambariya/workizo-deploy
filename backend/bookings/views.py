import logging
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)

from .models import Booking, RepairToken, MajorRepairApproval, BookingRejection, ChatMessage
from .serializers import BookingSerializer, RepairTokenSerializer, MajorRepairApprovalSerializer, PublicBookingSerializer, ChatMessageSerializer
from notifications.models import Notification
from notifications.serializers import NotificationSerializer
from validations import validate_accept_booking

User = get_user_model()

def send_booking_update(booking_id, booking_data, event_type='booking_status'):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"booking_{booking_id}",
            {
                "type": "booking_update",
                "data": {
                    "type": event_type,
                    "booking": booking_data
                }
            }
        )

def create_and_send_notification(user, title, message, notification_type='general'):
    noti = Notification.objects.create(
        user=user,
        title=title,
        message=message,
        notification_type=notification_type
    )
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            f"user_{user.id}",
            {
                "type": "send_notification",
                "data": {
                    "type": "notification",
                    "notification": NotificationSerializer(noti).data
                }
            }
        )
    return noti

class BookingViewSet(viewsets.ModelViewSet):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            logger.exception("Error creating booking: %s", e)
            if hasattr(e, 'detail'):
                return Response({"detail": str(e.detail)}, status=status.HTTP_400_BAD_REQUEST if getattr(e, 'status_code', 500) < 500 else status.HTTP_500_INTERNAL_SERVER_ERROR)
            return Response({"detail": f"Server error while creating booking: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Booking.objects.none()
        
        base_qs = Booking.objects.select_related('customer', 'worker', 'service_category', 'repair_token', 'payment').prefetch_related('major_repairs')
        
        if user.is_staff or user.role == 'admin':
            return base_qs.all().order_by('-created_at')
        elif user.role == 'worker':
            profile = getattr(user, 'worker_profile', None)
            category = profile.service_category if profile else None
            from django.db.models import Q
            if category:
                return base_qs.filter(
                    Q(worker=user) | Q(status='searching', service_category=category)
                ).order_by('-created_at')
            else:
                return base_qs.filter(worker=user).order_by('-created_at')
        else:
            return base_qs.filter(customer=user).order_by('-created_at')

    def perform_create(self, serializer):
        booking = serializer.save(customer=self.request.user)
        
        try:
            # Find and notify online approved workers in the service category
            from workers.models import WorkerProfile
            workers = WorkerProfile.objects.filter(
                online_status=True,
                approval_status='approved',
                service_category=booking.service_category
            )
            
            channel_layer = get_channel_layer()
            for wp in workers:
                # Create DB notification for the worker
                noti = Notification.objects.create(
                    user=wp.user,
                    title="New Instant Booking Request",
                    message=f"New instant request for {booking.service_category.name}. Problem: {booking.problem_type}.",
                    notification_type="incoming_booking_request"
                )
                if channel_layer:
                    try:
                        async_to_sync(channel_layer.group_send)(
                            f"user_{wp.user.id}",
                            {
                                "type": "send_notification",
                                "data": {
                                    "type": "notification",
                                    "notification": NotificationSerializer(noti).data,
                                    "booking": BookingSerializer(booking).data
                                }
                            }
                        )
                    except Exception as ex:
                        logger.error(f"Error sending WS notification to worker {wp.user.id}: {ex}")

            # Broadcast the new available booking request to all workers in this category
            if channel_layer:
                category_id_group = f"category_{booking.service_category.id}"
                category_slug_group = booking.service_category.name.lower().replace(' ', '_')
                for group in [category_id_group, category_slug_group]:
                    try:
                        async_to_sync(channel_layer.group_send)(
                            group,
                            {
                                "type": "send_notification",
                                "data": {
                                    "type": "booking_available",
                                    "booking": BookingSerializer(booking).data
                                }
                            }
                        )
                    except Exception as ex:
                        logger.error(f"Error broadcasting to group {group}: {ex}")

            # Create notification for self
            create_and_send_notification(
                user=self.request.user,
                title="Booking Placed",
                message=f"Your request for {booking.service_category.name} is placed. Searching for nearest worker...",
                notification_type="booking_update"
            )

            # Send booking confirmation email to customer
            from notifications.email_service import EmailNotificationService
            EmailNotificationService.send_booking_confirmation_email(booking)

            # Broadcast booking_created to the booking group
            booking_data = BookingSerializer(booking).data
            send_booking_update(booking.id, booking_data, 'booking_created')
        except Exception as e:
            logger.exception(f"Error during post-booking notification process for booking {booking.id}: {e}")

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny], url_path='track')
    def track(self, request):
        tracking_id = request.query_params.get('tracking_id')
        if not tracking_id:
            return Response({"detail": "tracking_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            booking = Booking.objects.get(tracking_id=tracking_id)
        except Booking.DoesNotExist:
            return Response({"detail": "No booking found with this Tracking ID."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = PublicBookingSerializer(booking)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-bookings')
    def my_bookings(self, request):
        user = request.user
        if user.role == 'worker':
            bookings = Booking.objects.filter(worker=user).order_by('-created_at')
        else:
            bookings = Booking.objects.filter(customer=user).order_by('-created_at')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='available-requests')
    def available_requests(self, request):
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can access this list."}, status=status.HTTP_403_FORBIDDEN)
        
        # Filter matching worker category
        profile = getattr(user, 'worker_profile', None)
        if not profile or not profile.online_status or profile.approval_status != 'approved':
            return Response([])

        category = profile.service_category
        if not category:
            return Response([])

        # Exclude rejected bookings
        rejected_booking_ids = BookingRejection.objects.filter(worker=user).values_list('booking_id', flat=True)

        bookings = Booking.objects.select_related('customer', 'worker', 'service_category', 'repair_token', 'payment').prefetch_related('major_repairs').filter(
            service_category=category,
            status='searching'
        ).exclude(id__in=rejected_booking_ids).order_by('-created_at')
        
        serializer = self.get_serializer(bookings, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can accept jobs."}, status=status.HTTP_403_FORBIDDEN)
        
        profile = getattr(user, 'worker_profile', None)
        if not profile or not profile.online_status or profile.approval_status != 'approved':
            return Response({"detail": "You must be approved and online to accept jobs."}, status=status.HTTP_400_BAD_REQUEST)
        
        from rest_framework.exceptions import ValidationError, PermissionDenied, NotFound
        with transaction.atomic():  # type: ignore
            try:
                booking = Booking.objects.select_for_update().get(pk=pk)
            except Booking.DoesNotExist:
                return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                validate_accept_booking(user, booking)
            except (ValidationError, PermissionDenied, NotFound) as ve:
                detail = ve.detail if hasattr(ve, 'detail') else str(ve)
                return Response({"detail": detail}, status=status.HTTP_400_BAD_REQUEST)

            if booking.status != 'searching':
                return Response({"detail": "This booking has already been assigned or cancelled."}, status=status.HTTP_400_BAD_REQUEST)
            
            booking.worker = user
            booking.status = 'accepted'
            booking.save()

            # Set worker availability status to BUSY
            profile = getattr(user, 'worker_profile', None)
            if profile:
                profile.availability_status = 'BUSY'
                profile.save()

        # Send captain assigned email to customer
        from notifications.email_service import EmailNotificationService
        EmailNotificationService.send_captain_assigned_email(booking)
        # Send new booking assigned email to captain
        EmailNotificationService.send_captain_booking_assigned_email(booking)

        # Serialized data
        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data, 'booking_accepted')

        # Broadcast to all workers in this category that booking is taken (remove from their dashboard)
        channel_layer = get_channel_layer()
        if channel_layer:
            category_id_group = f"category_{booking.service_category.id}"
            category_slug_group = booking.service_category.name.lower().replace(' ', '_')
            for group in [category_id_group, category_slug_group]:
                async_to_sync(channel_layer.group_send)(
                    group,
                    {
                        "type": "send_notification",
                        "data": {
                            "type": "booking_taken",
                            "booking_id": booking.id
                        }
                    }
                )

        # Notify Customer
        create_and_send_notification(
            user=booking.customer,
            title="Captain Assigned",
            message=f"Captain {user.full_name} has accepted your {booking.service_category.name.lower()} service request.",
            notification_type="booking_update"
        )
        # Notify Worker
        create_and_send_notification(
            user=user,
            title="Job Accepted",
            message=f"You successfully accepted booking #{booking.id} for {booking.customer.full_name}.",
            notification_type="booking_update"
        )

        return Response(booking_data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        if user.role != 'worker':
            return Response({"detail": "Only workers can reject jobs."}, status=status.HTTP_403_FORBIDDEN)

        BookingRejection.objects.get_or_create(worker=user, booking=booking)
        return Response({"detail": "Booking request rejected/declined."})


    @action(detail=True, methods=['post'], url_path='update-status')
    def update_status(self, request, pk=None):
        from django.db import transaction
        with transaction.atomic():  # type: ignore
            try:
                booking = Booking.objects.select_for_update().get(pk=pk)
            except Booking.DoesNotExist:
                return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
            
            user = request.user
            new_status = request.data.get('status')

            valid_statuses = [c[0] for c in Booking.STATUS_CHOICES]
            if new_status not in valid_statuses:
                return Response({"detail": "Invalid status value."}, status=status.HTTP_400_BAD_REQUEST)

            # Define allowed transitions for each status
            allowed_transitions = {
                'searching': ['accepted', 'cancelled'],
                'accepted': ['on_the_way', 'cancelled'],
                'on_the_way': ['arrived', 'cancelled'],
                'arrived': ['verified', 'cancelled'],
                'verified': ['inspection', 'repair_started'],
                'inspection': ['repair_started'],
                'repair_started': ['repair_completed'],
                'repair_completed': ['waiting_approval'],
                'waiting_approval': [],
                'WAITING_FOR_CASH_CONFIRMATION': [],
                'ready_to_complete': ['completed'],
                'completed': [],
                'cancelled': []
            }

            current_status = booking.status

            # Strict role-based & state machine validation
            if user.role == 'customer':
                if booking.customer != user:
                    return Response({"detail": "You do not own this booking."}, status=status.HTTP_403_FORBIDDEN)
                if new_status == 'cancelled':
                    if current_status != 'searching':
                        return Response({"detail": "You can only cancel a booking while it is searching for a captain."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    return Response({"detail": "Customers can only cancel bookings while searching for a captain. Job completion must be verified by the captain."}, status=status.HTTP_400_BAD_REQUEST)
                    
            elif user.role == 'worker':
                if booking.worker != user:
                    return Response({"detail": "You are not assigned to this job."}, status=status.HTTP_403_FORBIDDEN)
                
                # Workers cannot manually force verified status (must happen via verify-qr)
                if new_status == 'verified':
                    return Response({"detail": "Status 'verified' cannot be set manually."}, status=status.HTTP_400_BAD_REQUEST)
                    
                allowed = allowed_transitions.get(current_status, [])
                if new_status not in allowed:
                    return Response({"detail": f"Invalid status transition from {current_status} to {new_status}."}, status=status.HTTP_400_BAD_REQUEST)
                    
            elif user.role == 'admin' or user.is_staff:
                pass
            else:
                return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

            # Enforce that no booking can reach COMPLETED status until payment is PAID
            if new_status == 'completed':
                payment = getattr(booking, 'payment', None)
                if not payment or payment.status != 'PAID':
                    return Response({"detail": "Cannot complete job before payment has been verified."}, status=status.HTTP_400_BAD_REQUEST)

                # Process wallet credit and receipt only if transition is new (prevent duplicate payouts)
                if current_status != 'completed':
                    from decimal import Decimal
                    from workers.models import Wallet, WalletTransaction
                    from billing.views import compile_receipt_pdf
                    from notifications.email_service import EmailNotificationService

                    # Payout Wallet Credit (90% payout)
                    worker_payout = (payment.amount * Decimal('0.90')).quantize(Decimal('0.01'))
                    wallet, _ = Wallet.objects.select_for_update().get_or_create(worker=booking.worker)
                    wallet.current_balance += worker_payout
                    wallet.save()

                    # Payout transaction logging
                    WalletTransaction.objects.create(
                        wallet=wallet,
                        amount=worker_payout,
                        transaction_type='credit',
                        description=f"Earnings for Booking #{booking.id} ({booking.service_category.name})"
                    )

                    # Compile Receipt PDF
                    compile_receipt_pdf(payment)

                    # Send completion emails
                    try:
                        EmailNotificationService.send_payment_receipt_email(booking, payment)
                        EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)
                    except Exception as e:
                        logger.error(f"Error sending emails on completion: {e}")

                    # Notify worker of payment deposit
                    create_and_send_notification(
                        user=booking.worker,
                        title="Earnings Deposited",
                        message=f"₹{worker_payout} deposited to wallet for booking #{booking.id}.",
                        notification_type="payment"
                    )

                    # Notify admin
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        from billing.serializers import PaymentSerializer
                        async_to_sync(channel_layer.group_send)(
                            "admin_updates",
                            {
                                "type": "send_notification",
                                "data": {
                                    "type": "payment_update",
                                    "payment": PaymentSerializer(payment).data
                                }
                            }
                        )

            # Revert worker availability status to AVAILABLE upon completion or cancellation
            if new_status in ['completed', 'cancelled'] and booking.worker:
                wp = getattr(booking.worker, 'worker_profile', None)
                if wp:
                    wp.availability_status = 'AVAILABLE'
                    wp.save()

            booking.status = new_status
            
            # Handle uploaded images if any
            if 'before_photo' in request.FILES:
                booking.before_photo = request.FILES['before_photo']
            if 'after_photo' in request.FILES:
                booking.after_photo = request.FILES['after_photo']
            if 'spare_part_photo' in request.FILES:
                booking.spare_part_photo = request.FILES['spare_part_photo']
            if 'invoice_photo' in request.FILES:
                booking.invoice_photo = request.FILES['invoice_photo']
            if 'optional_video' in request.FILES:
                booking.optional_video = request.FILES['optional_video']

            booking.save()

        # Send status-specific emails
        from notifications.email_service import EmailNotificationService
        if new_status == 'arrived':
            EmailNotificationService.send_captain_arrived_email(booking)
        elif new_status == 'repair_started':
            EmailNotificationService.send_work_started_email(booking)
        elif new_status == 'cancelled':
            reason = request.data.get('cancellation_reason') or request.data.get('reason')
            EmailNotificationService.send_booking_cancelled_email(booking, reason)
            if booking.worker:
                EmailNotificationService.send_captain_booking_cancelled_email(booking, reason)

        # Notify both parties
        status_messages = {
            'on_the_way': f"Captain {booking.worker.full_name} is on the way.",
            'arrived': f"Captain {booking.worker.full_name} has arrived at your location.",
            'inspection': "Captain is performing an initial inspection of the issue.",
            'repair_started': "Captain has started the repair work.",
            'repair_completed': "Captain completed the repair. Preparing service bill invoice.",
            'waiting_approval': "Service bill generated. Awaiting your approval.",
            'completed': "Service job completed. Invoice payment confirmed.",
            'cancelled': f"Booking #{booking.id} has been cancelled."
        }

        msg = status_messages.get(new_status)
        if msg:
            create_and_send_notification(booking.customer, "Booking Status Update", msg, "booking_update")
            if booking.worker:
                create_and_send_notification(booking.worker, "Job Status Update", f"Job status updated to {new_status.replace('_', ' ').title()}.", "booking_update")

        booking_data = self.get_serializer(booking).data
        
        # Determine the event type for status updates
        event_type = 'booking_status'
        if new_status == 'on_the_way':
            event_type = 'captain_arriving'
        elif new_status == 'repair_started':
            event_type = 'work_started'
        elif new_status == 'repair_completed':
            event_type = 'work_completed'
            
        send_booking_update(booking.id, booking_data, event_type)

        return Response(booking_data)

    @action(detail=True, methods=['post'], url_path='verify-qr')
    def verify_qr(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status != 'arrived':
            return Response({"verified": False, "detail": f"Cannot verify QR code when booking status is '{booking.status}'. Must be 'arrived'."}, status=status.HTTP_400_BAD_REQUEST)
        
        qr_value = request.data.get('qr_code_value') or request.data.get('qr_code')
        if not qr_value:
            return Response({"verified": False, "detail": "Missing QR code value."}, status=status.HTTP_400_BAD_REQUEST)
            
        expected_token = str(booking.qr_code_value)[:8].strip().upper()
        provided_token = str(qr_value).strip().upper()
        
        if expected_token == provided_token:
            booking.status = 'verified'
            booking.save()

            booking_data = self.get_serializer(booking).data
            send_booking_update(booking.id, booking_data)

            create_and_send_notification(
                user=booking.customer,
                title="QR Verified Successfully",
                message="Captain QR verification verified. Work is beginning.",
                notification_type="booking_update"
            )

            return Response({"verified": True, "booking": booking_data})
        else:
            return Response({"verified": False, "detail": "Invalid QR code value. Please ask customer to reload."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='request-major-repair')
    def request_major_repair(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get('reason')
        estimated_cost = request.data.get('estimated_cost')

        if not reason or not estimated_cost:
            return Response({"detail": "Reason and estimated_cost required."}, status=status.HTTP_400_BAD_REQUEST)

        approval = MajorRepairApproval.objects.create(
            booking=booking,
            reason=reason,
            estimated_cost=estimated_cost,
            status='pending'
        )

        create_and_send_notification(
            user=booking.customer,
            title="Major Repair Approval Needed",
            message=f"Captain requested approval for {reason}. Estimate: ₹{estimated_cost}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(MajorRepairApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'], url_path='respond-major-repair')
    def respond_major_repair(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if booking.customer != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        approval_id = request.data.get('approval_id')
        response_status = request.data.get('status') # approved / rejected

        if response_status not in ['approved', 'rejected']:
            return Response({"detail": "Invalid response status."}, status=status.HTTP_400_BAD_REQUEST)

        approval = get_object_or_404(MajorRepairApproval, id=approval_id, booking=booking)
        approval.status = response_status
        approval.save()

        # Notify Captain
        create_and_send_notification(
            user=booking.worker,
            title=f"Repair Estimate {response_status.title()}",
            message=f"Customer has {response_status} the major repair estimate of ₹{approval.estimated_cost}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(MajorRepairApprovalSerializer(approval).data)

    @action(detail=True, methods=['post'], url_path='update-repair-token')
    def update_repair_token(self, request, pk=None):
        booking = self.get_object()
        user = request.user
        
        if user.role != 'worker' or booking.worker != user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        token_status = request.data.get('status')
        valid_token_statuses = [c[0] for c in RepairToken.STATUS_CHOICES]

        if token_status not in valid_token_statuses:
            return Response({"detail": "Invalid token status."}, status=status.HTTP_400_BAD_REQUEST)

        token_number = request.data.get('token_number')
        if not token_number:
            import time
            # Generate a unique repair token
            token_number = f"TKN-{booking.id}-{int(time.time())}"

        token, created = RepairToken.objects.get_or_create(
            booking=booking,
            defaults={'token_number': token_number, 'status': token_status}
        )

        if not created:
            token.status = token_status
            token.save()

        create_and_send_notification(
            user=booking.customer,
            title="Workshop Repair Update",
            message=f"Workshop status updated to: {token.get_status_display()}.",
            notification_type="booking_update"
        )

        booking_data = self.get_serializer(booking).data
        send_booking_update(booking.id, booking_data)

        return Response(RepairTokenSerializer(token).data)


class ChatMessagesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)

        # Verify user is customer or worker
        if request.user.role != 'admin' and not request.user.is_staff:
            if booking.customer_id != request.user.id and booking.worker_id != request.user.id:
                return Response({"detail": "You are not authorized to view this chat."}, status=status.HTTP_403_FORBIDDEN)

        # Mark received unread messages as read
        unread_messages = ChatMessage.objects.filter(booking=booking, receiver=request.user, is_read=False)
        unread_messages.update(is_read=True)

        messages = ChatMessage.objects.filter(booking=booking).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



