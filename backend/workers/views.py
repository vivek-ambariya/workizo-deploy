from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from workers.models import WorkerProfile
from workers.serializers import WorkerProfileSerializer
from accounts.permissions import IsWorker
from workers.ocr_service import extract_document_info
import logging

logger = logging.getLogger(__name__)

class WorkerRegisterProfileView(APIView):
    permission_classes = (IsWorker,)
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        try:
            profile = request.user.worker_profile
        except WorkerProfile.DoesNotExist:
            profile = WorkerProfile.objects.create(user=request.user)
            
        # Update User fields if provided
        user = request.user
        user_updated = False
        
        full_name = request.data.get('full_name')
        if full_name:
            user.full_name = full_name
            user_updated = True
            
        phone = request.data.get('phone')
        if phone:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(phone=phone).exclude(id=user.id).exists():
                return Response({'phone': ['This phone number is already in use.']}, status=status.HTTP_400_BAD_REQUEST)
            user.phone = phone
            user_updated = True
            
        if user_updated:
            user.save()
            
        # Perform updates
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            profile_obj = serializer.save()
            profile_obj.approval_status = 'pending'
            profile_obj.is_verified = False
            profile_obj.save()
            
            # Send KYC submitted email to captain
            from notifications.email_service import EmailNotificationService
            EmailNotificationService.send_captain_kyc_submitted_email(user)
            return Response({
                'profile': WorkerProfileSerializer(profile_obj).data,
                'message': 'Worker profile details and documents uploaded successfully.'
            }, status=status.HTTP_200_OK)
            
        logger.error(f"WORKER REGISTER PROFILE VALIDATION ERRORS: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from workers.models import Wallet, WalletTransaction
from workers.serializers import WalletSerializer

class WalletDetailView(APIView):
    permission_classes = (IsWorker,)

    def get(self, request):
        wallet, _ = Wallet.objects.get_or_create(worker=request.user)
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)

class WalletWithdrawView(APIView):
    permission_classes = (IsWorker,)

    def post(self, request):
        wallet, _ = Wallet.objects.get_or_create(worker=request.user)
        amount = request.data.get('amount')
        if not amount:
            return Response({"detail": "Amount is required."}, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal
        try:
            val = Decimal(str(amount))
        except ValueError:
            return Response({"detail": "Invalid amount format."}, status=status.HTTP_400_BAD_REQUEST)

        if val <= 0:
            return Response({"detail": "Amount must be positive."}, status=status.HTTP_400_BAD_REQUEST)

        if wallet.current_balance < val:
            return Response({"detail": "Insufficient balance."}, status=status.HTTP_400_BAD_REQUEST)

        wallet.current_balance -= val
        wallet.save()

        # Create Debit Transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=val,
            transaction_type='debit',
            description="Withdrawal payout transfer completed (Simulated)"
        )

        return Response(WalletSerializer(wallet).data)

from django.utils import timezone
from django.db.models import Sum, Avg
from datetime import timedelta
from bookings.models import Booking, BookingRejection
from services.models import Rating

class WorkerDashboardStatsView(APIView):
    permission_classes = (IsWorker,)

    def get(self, request):
        user = request.user
        
        # Get wallet
        wallet, _ = Wallet.objects.get_or_create(worker=user)
        
        # Calculate earnings
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        today_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=today_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        week_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=week_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        month_earnings = wallet.transactions.filter(
            transaction_type='credit',
            created_at__gte=month_start
        ).aggregate(total=Sum('amount'))['total'] or 0.00
        
        # Jobs counts
        all_jobs = Booking.objects.filter(worker=user)
        total_jobs = all_jobs.count()
        completed_jobs = all_jobs.filter(status='completed').count()
        pending_jobs = all_jobs.exclude(status__in=['completed', 'cancelled', 'searching']).count()
        
        # Ratings avg
        ratings_avg = Rating.objects.filter(worker=user).aggregate(avg=Avg('rating'))['avg']
        ratings_avg = round(ratings_avg, 1) if ratings_avg else 4.8
        
        # Acceptance Rate
        accepted_count = all_jobs.count()
        rejected_count = BookingRejection.objects.filter(worker=user).count()
        total_offers = accepted_count + rejected_count
        acceptance_rate = round((accepted_count / total_offers) * 100, 1) if total_offers > 0 else 100.0
        
        # Completion Rate
        completion_rate = round((completed_jobs / total_jobs) * 100, 1) if total_jobs > 0 else 100.0
        
        # Recent activity ledger
        recent_activities = []
        
        # Recent completed/updated jobs
        for b in all_jobs.order_by('-updated_at')[:5]:
            recent_activities.append({
                "id": f"act-job-{b.id}",
                "type": "job",
                "title": f"Job #{b.id} - {b.status.replace('_', ' ').title()}",
                "description": f"{b.service_category.name} service for {b.customer.full_name}.",
                "time": b.updated_at.isoformat()
            })
            
        # Recent transactions
        for txn in wallet.transactions.order_by('-created_at')[:5]:
            recent_activities.append({
                "id": f"act-txn-{txn.id}",
                "type": "wallet",
                "title": f"Wallet {txn.transaction_type.title()}",
                "description": f"{txn.description} - Amount: ₹{txn.amount}",
                "time": txn.created_at.isoformat()
            })
            
        recent_activities = sorted(recent_activities, key=lambda x: x['time'], reverse=True)[:7]
        
        # Graph data: last 7 credit transactions
        graph_txns = wallet.transactions.filter(transaction_type='credit').order_by('-created_at')[:7]
        graph_data = []
        for t in reversed(graph_txns):
            graph_data.append({
                "name": t.created_at.strftime('%a %d'),
                "Amount": float(t.amount)
            })
            
        if not graph_data:
            graph_data = [
                { "name": "Mon", "Amount": 0.0 },
                { "name": "Tue", "Amount": 0.0 },
                { "name": "Wed", "Amount": 0.0 },
                { "name": "Thu", "Amount": 0.0 },
                { "name": "Fri", "Amount": 0.0 },
                { "name": "Sat", "Amount": 0.0 },
                { "name": "Sun", "Amount": 0.0 }
            ]

        # Profile Photo URI absolute
        profile_photo = None
        if user.profile_photo:
            profile_photo = request.build_absolute_uri(user.profile_photo.url)
        elif getattr(user, 'worker_profile', None) and user.worker_profile.profile_photo:
            profile_photo = request.build_absolute_uri(user.worker_profile.profile_photo.url)
            
        return Response({
            "welcome_message": f"Welcome, Captain {user.full_name}!",
            "worker_name": user.full_name,
            "profile_photo": profile_photo,
            "service_category": user.worker_profile.service_category.name if getattr(user, 'worker_profile', None) and user.worker_profile.service_category else "Not Assigned",
            "verification_status": user.worker_profile.approval_status if getattr(user, 'worker_profile', None) else "pending",
            "online_status": user.worker_profile.online_status if getattr(user, 'worker_profile', None) else False,
            "today_earnings": float(today_earnings),
            "weekly_earnings": float(week_earnings),
            "monthly_earnings": float(month_earnings),
            "wallet_balance": float(wallet.current_balance),
            "total_jobs": total_jobs,
            "pending_jobs": pending_jobs,
            "completed_jobs": completed_jobs,
            "rating": ratings_avg,
            "acceptance_rate": acceptance_rate,
            "completion_rate": completion_rate,
            "recent_activity": recent_activities,
            "performance_graph": graph_data
        })

class OCRExtractView(APIView):
    permission_classes = (IsWorker,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file_obj = request.FILES.get('document')
        if not file_obj:
            return Response({"detail": "No document file was provided."}, status=status.HTTP_400_BAD_REQUEST)
            
        # File size check (max 10MB)
        if file_obj.size > 10 * 1024 * 1024:
            return Response({"detail": "File size exceeds the 10MB limit."}, status=status.HTTP_400_BAD_REQUEST)

        # File extension check
        ext = file_obj.name.split('.')[-1].lower() if '.' in file_obj.name else ''
        if ext not in ['jpg', 'jpeg', 'png', 'pdf', 'webp', 'gif']:
            return Response({"detail": "Invalid file format. Please upload a JPG, PNG, GIF, WEBP, or PDF file."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_bytes = file_obj.read()
            extracted_data = extract_document_info(image_bytes, filename=file_obj.name)
            return Response(extracted_data, status=status.HTTP_200_OK)
        except TypeError as te:
            # Unsupported document type (e.g. classification failed)
            return Response({"detail": "Unsupported document."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as ve:
            # Strict formatting/validation failure
            return Response({"detail": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"OCR document extraction failed: {e}")
            return Response({
                "detail": "Unable to read the document. Please upload a clear Aadhaar or PAN card."
            }, status=status.HTTP_400_BAD_REQUEST)

