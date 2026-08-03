import csv
from datetime import datetime, timedelta
from decimal import Decimal
from django.db import models
from django.db.models import Sum, Avg, Count
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.auth import get_user_model
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response

from accounts.serializers import UserSerializer, ChangePasswordSerializer
from accounts.permissions import IsAdminUser
from customers.models import CustomerProfile
from customers.serializers import CustomerProfileSerializer
from workers.models import WorkerProfile
from workers.serializers import WorkerProfileSerializer, WalletSerializer
from bookings.models import Booking
from bookings.serializers import BookingSerializer
from bookings.views import send_booking_update
from billing.models import Bill, Payment
from billing.serializers import BillSerializer, PaymentSerializer
from services.models import ServiceCategory, Rating, SystemSetting
from services.serializers import ServiceCategorySerializer, SystemSettingSerializer
from notifications.models import Notification, Announcement
from notifications.serializers import AnnouncementSerializer

User = get_user_model()

# Keep existing views for compatibility

class AdminListCustomersView(APIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request):
        customers = User.objects.filter(role='customer').select_related('customer_profile').order_by('-created_at')
        data = []
        for customer in customers:
            user_data = UserSerializer(customer).data
            try:
                profile = customer.customer_profile
                profile_data = CustomerProfileSerializer(profile).data
            except CustomerProfile.DoesNotExist:
                profile_data = None
            
            # Additional aggregate fields for listing
            bookings_count = Booking.objects.filter(customer=customer).count()
            ratings_avg = Rating.objects.filter(customer=customer).aggregate(Avg('rating'))['rating__avg']
            
            data.append({
                'user': user_data,
                'profile': profile_data,
                'total_bookings': bookings_count,
                'rating': round(ratings_avg or 0, 1)
            })
        return Response(data, status=status.HTTP_200_OK)

class AdminListWorkersView(APIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request):
        workers = User.objects.filter(role='worker').select_related('worker_profile', 'worker_profile__service_category').order_by('-created_at')
        data = []
        for worker in workers:
            user_data = UserSerializer(worker).data
            try:
                profile = worker.worker_profile
                profile_data = WorkerProfileSerializer(profile).data
            except WorkerProfile.DoesNotExist:
                profile_data = None
            
            # Additional fields
            ratings_avg = Rating.objects.filter(worker=worker).aggregate(Avg('rating'))['rating__avg']
            
            data.append({
                'user': user_data,
                'profile': profile_data,
                'rating': round(ratings_avg or 0, 1)
            })
        return Response(data, status=status.HTTP_200_OK)

class AdminVerifyWorkerView(APIView):
    permission_classes = (IsAdminUser,)
    
    def post(self, request, pk):
        try:
            profile = WorkerProfile.objects.get(user_id=pk)
        except WorkerProfile.DoesNotExist:
            return Response({"detail": "Worker profile not found"}, status=status.HTTP_404_NOT_FOUND)
            
        approval_status = request.data.get('approval_status')
        if approval_status not in ['approved', 'rejected', 'pending']:
            return Response({"detail": "Invalid approval status"}, status=status.HTTP_400_BAD_REQUEST)
            
        profile.approval_status = approval_status
        if approval_status == 'approved':
            profile.is_verified = True
        else:
            profile.is_verified = False
            
        profile.save()
        
        # Send KYC status email to captain
        from notifications.email_service import EmailNotificationService
        if approval_status == 'approved':
            EmailNotificationService.send_captain_kyc_approved_email(profile.user)
        elif approval_status == 'rejected':
            rejection_reason = request.data.get('rejection_reason') or request.data.get('reason')
            EmailNotificationService.send_captain_kyc_rejected_email(profile.user, rejection_reason)
            
        return Response({
            'profile': WorkerProfileSerializer(profile).data,
            'message': f"Worker status updated to {approval_status} successfully."
        }, status=status.HTTP_200_OK)

class AdminToggleUserActiveView(APIView):
    permission_classes = (IsAdminUser,)
    
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            
        if request.user.id == user.id:
            return Response({"detail": "You cannot deactivate your own admin account."}, status=status.HTTP_400_BAD_REQUEST)
            
        user.is_active = not user.is_active
        user.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': f"User active status set to {user.is_active} successfully."
        }, status=status.HTTP_200_OK)

# EXTENDED ADMIN VIEWS

class AdminDashboardStatsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        try:
            today = timezone.now().date()
            start_of_month = today.replace(day=1)
            current_year = today.year

            # Core Metrics Cards
            total_customers = User.objects.filter(role='customer').count()
            total_captains = User.objects.filter(role='worker').count()
            online_captains = WorkerProfile.objects.filter(online_status=True).count()
            offline_captains = WorkerProfile.objects.filter(online_status=False).count()
            pending_approvals = WorkerProfile.objects.filter(approval_status='pending').count()
            
            total_bookings = Booking.objects.count()
            active_bookings = Booking.objects.exclude(status__in=['completed', 'cancelled']).count()
            completed_bookings = Booking.objects.filter(status='completed').count()
            cancelled_bookings = Booking.objects.filter(status='cancelled').count()
            
            # Revenue across all workers in WORKIZO
            PAID_STATUSES = ['PAID', 'COMPLETED', 'success', 'Paid', 'Completed']
            
            # 1. Today's Revenue
            today_payment_sum = Payment.objects.filter(status__in=PAID_STATUSES, payment_time__date=today).aggregate(Sum('amount'))['amount__sum']
            if not today_payment_sum:
                today_payment_sum = Payment.objects.filter(status__in=PAID_STATUSES, created_at__date=today).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
            
            today_bill_sum = Bill.objects.filter(is_approved=True, created_at__date=today, booking__status__in=['ready_to_complete', 'completed']).aggregate(Sum('grand_total'))['grand_total__sum'] or Decimal('0.00')
            today_revenue = max(today_payment_sum, today_bill_sum)

            # 2. Monthly Revenue
            monthly_payment_sum = Payment.objects.filter(status__in=PAID_STATUSES, payment_time__date__gte=start_of_month).aggregate(Sum('amount'))['amount__sum']
            if not monthly_payment_sum:
                monthly_payment_sum = Payment.objects.filter(status__in=PAID_STATUSES, created_at__date__gte=start_of_month).aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
            
            monthly_bill_sum = Bill.objects.filter(is_approved=True, created_at__date__gte=start_of_month, booking__status__in=['ready_to_complete', 'completed']).aggregate(Sum('grand_total'))['grand_total__sum'] or Decimal('0.00')
            monthly_revenue = max(monthly_payment_sum, monthly_bill_sum)

            # Ratings
            avg_customer_rating = Rating.objects.all().aggregate(Avg('rating'))['rating__avg'] or 0.0
            avg_captain_rating = Rating.objects.all().aggregate(Avg('rating'))['rating__avg'] or 0.0

            # Charts Data
            # 1. Daily Bookings (Last 30 Days)
            thirty_days_ago = today - timedelta(days=30)
            daily_bookings_query = Booking.objects.filter(created_at__date__gte=thirty_days_ago) \
                .annotate(date=TruncDate('created_at')) \
                .values('date') \
                .annotate(count=Count('id')) \
                .order_by('date')
            
            daily_bookings_dict = {}
            for item in daily_bookings_query:
                d_val = item['date']
                if d_val:
                    d_str = d_val.strftime('%Y-%m-%d') if hasattr(d_val, 'strftime') else str(d_val)[:10]
                    daily_bookings_dict[d_str] = item['count']

            daily_bookings = []
            for x in range(31):
                d = thirty_days_ago + timedelta(days=x)
                d_str = d.strftime('%Y-%m-%d')
                daily_bookings.append({
                    'date': d.strftime('%b %d'),
                    'bookings': daily_bookings_dict.get(d_str, 0)
                })

            # 2. Monthly Revenue Performance (Current Year)
            monthly_rev_query = Payment.objects.filter(status__in=PAID_STATUSES, created_at__year=current_year) \
                .annotate(month=TruncMonth('created_at')) \
                .values('month') \
                .annotate(total=Sum('amount')) \
                .order_by('month')

            monthly_rev_dict = {}
            for item in monthly_rev_query:
                m_val = item['month']
                if m_val:
                    try:
                        m_idx = m_val.month if hasattr(m_val, 'month') else int(str(m_val).split('-')[1])
                        monthly_rev_dict[m_idx] = float(item['total'] or 0.00)
                    except Exception:
                        pass

            # Incorporate approved bills for current year
            bill_rev_query = Bill.objects.filter(is_approved=True, created_at__year=current_year, booking__status__in=['ready_to_complete', 'completed']) \
                .annotate(month=TruncMonth('created_at')) \
                .values('month') \
                .annotate(total=Sum('grand_total'))
            
            for item in bill_rev_query:
                m_val = item['month']
                if m_val:
                    try:
                        m_idx = m_val.month if hasattr(m_val, 'month') else int(str(m_val).split('-')[1])
                        b_total = float(item['total'] or 0.00)
                        if b_total > monthly_rev_dict.get(m_idx, 0.0):
                            monthly_rev_dict[m_idx] = b_total
                    except Exception:
                        pass

            months_list = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            monthly_revenue_chart = []
            for m_idx in range(1, 13):
                monthly_revenue_chart.append({
                    'month': months_list[m_idx - 1],
                    'revenue': monthly_rev_dict.get(m_idx, 0.00)
                })

            # 3. Service Category Distribution
            category_distribution = Booking.objects.values('service_category__name') \
                .annotate(value=Count('id')) \
                .order_by('-value')
            
            category_dist = [{'name': item['service_category__name'] or 'General', 'value': item['value']} for item in category_distribution]
            if not category_dist:
                categories = ServiceCategory.objects.all()
                category_dist = [{'name': cat.name, 'value': 0} for cat in categories]

            # 4. Booking Status Distribution
            status_distribution = Booking.objects.values('status') \
                .annotate(value=Count('id'))
            status_dist = [{'name': item['status'].replace('_', ' ').capitalize(), 'value': item['value']} for item in status_distribution]

            # 5. Top Performing Captains
            top_captains_query = Rating.objects.values('worker__full_name') \
                .annotate(avg_rating=Avg('rating'), jobs=Count('id')) \
                .order_by('-avg_rating', '-jobs')[:5]
            top_captains = [{
                'name': item['worker__full_name'] or 'Captain',
                'rating': round(float(item['avg_rating']), 1) if item['avg_rating'] else 0.0,
                'jobs': item['jobs']
            } for item in top_captains_query]
            
            if not top_captains:
                approved_workers = WorkerProfile.objects.filter(approval_status='approved').select_related('user')[:5]
                top_captains = [{
                    'name': wp.user.full_name,
                    'rating': 5.0,
                    'jobs': Booking.objects.filter(worker=wp.user, status='completed').count()
                } for wp in approved_workers]

            # Recent Activities Feed
            recent_customers = User.objects.filter(role='customer').order_by('-created_at')[:3]
            recent_workers = User.objects.filter(role='worker').order_by('-created_at')[:3]
            recent_bookings = Booking.objects.order_by('-created_at')[:3]
            recent_payments = Payment.objects.filter(status__in=PAID_STATUSES).order_by('-created_at')[:3]

            recent_activities = []
            for c in recent_customers:
                recent_activities.append({
                    'type': 'customer_registered',
                    'title': 'New Customer Registration',
                    'description': f"{c.full_name} ({c.email}) joined.",
                    'time': c.created_at
                })
            for w in recent_workers:
                recent_activities.append({
                    'type': 'captain_registered',
                    'title': 'New Captain Registration',
                    'description': f"{w.full_name} applied for verification.",
                    'time': w.created_at
                })
            for b in recent_bookings:
                category_name = b.service_category.name if b.service_category else 'Service'
                recent_activities.append({
                    'type': 'booking_created',
                    'title': 'Booking Created',
                    'description': f"Booking #{b.id} ({category_name}) initiated.",
                    'time': b.created_at
                })
            for p in recent_payments:
                recent_activities.append({
                    'type': 'payment_received',
                    'title': 'Payment Collected',
                    'description': f"Payment of ₹{p.amount} verified for Booking #{p.booking_id}.",
                    'time': p.created_at
                })

            recent_activities.sort(key=lambda x: x['time'], reverse=True)
            recent_activities = recent_activities[:6]

            data = {
                'cards': {
                    'totalCustomers': total_customers,
                    'totalCaptains': total_captains,
                    'onlineCaptains': online_captains,
                    'offlineCaptains': offline_captains,
                    'pendingApprovals': pending_approvals,
                    'totalBookings': total_bookings,
                    'activeBookings': active_bookings,
                    'completedBookings': completed_bookings,
                    'cancelledBookings': cancelled_bookings,
                    'todayRevenue': float(today_revenue),
                    'monthlyRevenue': float(monthly_revenue),
                    'avgCustomerRating': round(float(avg_customer_rating), 1),
                    'avgCaptainRating': round(float(avg_captain_rating), 1)
                },
                'charts': {
                    'dailyBookings': daily_bookings,
                    'monthlyRevenue': monthly_revenue_chart,
                    'categoryDistribution': category_dist,
                    'statusDistribution': status_dist,
                    'topCaptains': top_captains
                },
                'activities': recent_activities
            }
            return Response(data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'cards': {
                    'totalCustomers': User.objects.filter(role='customer').count(),
                    'totalCaptains': User.objects.filter(role='worker').count(),
                    'onlineCaptains': WorkerProfile.objects.filter(online_status=True).count(),
                    'offlineCaptains': WorkerProfile.objects.filter(online_status=False).count(),
                    'pendingApprovals': WorkerProfile.objects.filter(approval_status='pending').count(),
                    'totalBookings': Booking.objects.count(),
                    'activeBookings': Booking.objects.exclude(status__in=['completed', 'cancelled']).count(),
                    'completedBookings': Booking.objects.filter(status='completed').count(),
                    'cancelledBookings': Booking.objects.filter(status='cancelled').count(),
                    'todayRevenue': 0.0,
                    'monthlyRevenue': 0.0,
                    'avgCustomerRating': 0.0,
                    'avgCaptainRating': 0.0
                },
                'charts': {
                    'dailyBookings': [],
                    'monthlyRevenue': [],
                    'categoryDistribution': [],
                    'statusDistribution': [],
                    'topCaptains': []
                },
                'activities': []
            }, status=status.HTTP_200_OK)


class AdminBookingsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        bookings = Booking.objects.all().order_by('-created_at')

        # Filters
        category_id = request.query_params.get('category')
        status_filter = request.query_params.get('status')
        payment_filter = request.query_params.get('payment_status')
        search_query = request.query_params.get('search')
        date_query = request.query_params.get('date')

        if category_id:
            bookings = bookings.filter(service_category_id=category_id)
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        if payment_filter:
            bookings = bookings.filter(payment__status=payment_filter)
        if date_query:
            try:
                parsed_date = datetime.strptime(date_query, '%Y-%m-%d').date()
                bookings = bookings.filter(created_at__date=parsed_date)
            except ValueError:
                pass
        if search_query:
            bookings = bookings.filter(
                models.Q(id__icontains=search_query) |
                models.Q(tracking_id__icontains=search_query) |
                models.Q(customer__full_name__icontains=search_query) |
                models.Q(worker__full_name__icontains=search_query)
            )

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminBookingDetailView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = BookingSerializer(booking)
        bill_data = None
        try:
            bill_data = BillSerializer(booking.bill).data
        except:
            pass

        data = serializer.data
        data['bill'] = bill_data
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        # Actions: Cancel, Reassign
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)
        
        action = request.data.get('action')
        if action == 'cancel':
            booking.status = 'cancelled'
            booking.save()
            send_booking_update(booking.id, BookingSerializer(booking).data)
            return Response({"message": "Booking cancelled successfully."}, status=status.HTTP_200_OK)
        
        elif action == 'assign':
            worker_id = request.data.get('worker_id')
            try:
                worker = User.objects.get(id=worker_id, role='worker')
            except User.DoesNotExist:
                return Response({"detail": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)
            
            booking.worker = worker
            booking.status = 'accepted'
            booking.save()
            send_booking_update(booking.id, BookingSerializer(booking).data)
            return Response({"message": f"Assigned to {worker.full_name} successfully."}, status=status.HTTP_200_OK)

        return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            booking.delete()
            return Response({"message": "Booking deleted successfully"}, status=status.HTTP_200_OK)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminWorkerDetailView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request, pk):
        try:
            worker = User.objects.get(pk=pk, role='worker')
        except User.DoesNotExist:
            return Response({"detail": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user_data = UserSerializer(worker).data
        try:
            profile = worker.worker_profile
            profile_data = WorkerProfileSerializer(profile).data
        except WorkerProfile.DoesNotExist:
            profile_data = None
        
        # Wallet and ratings
        try:
            wallet = worker.wallet
            wallet_data = WalletSerializer(wallet).data
        except:
            wallet_data = None
            
        completed_jobs_count = Booking.objects.filter(worker=worker, status='completed').count()
        earnings = Bill.objects.filter(booking__worker=worker, booking__status='completed').aggregate(Sum('labour_charges'))['labour_charges__sum'] or 0.0
        ratings_avg = Rating.objects.filter(worker=worker).aggregate(Avg('rating'))['rating__avg'] or 0.0

        return Response({
            'user': user_data,
            'profile': profile_data,
            'wallet': wallet_data,
            'completed_jobs': completed_jobs_count,
            'earnings': float(earnings),
            'rating': round(ratings_avg, 1)
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            worker = User.objects.get(pk=pk, role='worker')
        except User.DoesNotExist:
            return Response({"detail": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Update user detail
        user_data = request.data.get('user', {})
        profile_data = request.data.get('profile', {})

        if 'full_name' in user_data:
            worker.full_name = user_data['full_name']
        if 'email' in user_data:
            worker.email = user_data['email']
        if 'phone' in user_data:
            worker.phone = user_data['phone']
        worker.save()

        try:
            profile = worker.worker_profile
            if 'experience' in profile_data:
                profile.experience = profile_data['experience']
            if 'address' in profile_data:
                profile.address = profile_data['address']
            if 'city' in profile_data:
                profile.city = profile_data['city']
            if 'state' in profile_data:
                profile.state = profile_data['state']
            if 'pincode' in profile_data:
                profile.pincode = profile_data['pincode']
            if 'aadhaar_number' in profile_data:
                profile.aadhaar_number = profile_data['aadhaar_number']
            if 'pan_number' in profile_data:
                profile.pan_number = profile_data['pan_number']
            if 'bank_account' in profile_data:
                profile.bank_account = profile_data['bank_account']
            if 'ifsc_code' in profile_data:
                profile.ifsc_code = profile_data['ifsc_code']
            profile.save()
        except WorkerProfile.DoesNotExist:
            pass

        return Response({"message": "Worker profile updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            worker = User.objects.get(pk=pk, role='worker')
            worker.delete()
            return Response({"message": "Worker deleted successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "Worker not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminCustomerDetailView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request, pk):
        try:
            customer = User.objects.get(pk=pk, role='customer')
        except User.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user_data = UserSerializer(customer).data
        try:
            profile = customer.customer_profile
            profile_data = CustomerProfileSerializer(profile).data
        except CustomerProfile.DoesNotExist:
            profile_data = None
        
        # Booking history
        bookings = Booking.objects.filter(customer=customer).order_by('-created_at')
        bookings_serializer = BookingSerializer(bookings, many=True)

        # Payments history
        payments = Payment.objects.filter(booking__customer=customer).order_by('-created_at')
        payments_serializer = PaymentSerializer(payments, many=True)

        return Response({
            'user': user_data,
            'profile': profile_data,
            'bookings': bookings_serializer.data,
            'payments': payments_serializer.data
        }, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            customer = User.objects.get(pk=pk, role='customer')
        except User.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user_data = request.data.get('user', {})
        profile_data = request.data.get('profile', {})

        if 'full_name' in user_data:
            customer.full_name = user_data['full_name']
        if 'email' in user_data:
            customer.email = user_data['email']
        if 'phone' in user_data:
            customer.phone = user_data['phone']
        customer.save()

        try:
            profile = customer.customer_profile
            if 'address' in profile_data:
                profile.address = profile_data['address']
            if 'city' in profile_data:
                profile.city = profile_data['city']
            if 'state' in profile_data:
                profile.state = profile_data['state']
            if 'pincode' in profile_data:
                profile.pincode = profile_data['pincode']
            profile.save()
        except CustomerProfile.DoesNotExist:
            pass

        return Response({"message": "Customer profile updated successfully."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            customer = User.objects.get(pk=pk, role='customer')
            customer.delete()
            return Response({"message": "Customer deleted successfully"}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)


class AdminCategoryView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        categories = ServiceCategory.objects.all()
        serializer = ServiceCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        try:
            category = ServiceCategory.objects.get(pk=pk)
        except ServiceCategory.DoesNotExist:
            return Response({"detail": "Category not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Admin can update description, base charge, status, and icon
        is_active = request.data.get('is_active', category.is_active)
        description = request.data.get('description', category.description)
        icon = request.data.get('icon', category.icon)
        base_labour_charge = request.data.get('base_labour_charge', category.base_labour_charge)

        category.is_active = is_active
        category.description = description
        category.icon = icon
        category.base_labour_charge = base_labour_charge
        category.save()

        return Response(ServiceCategorySerializer(category).data, status=status.HTTP_200_OK)


class AdminBillsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        bills = Bill.objects.all().order_by('-created_at')
        
        # Searching/filtering
        search_query = request.query_params.get('search')
        if search_query:
            bills = bills.filter(
                models.Q(id__icontains=search_query) |
                models.Q(booking__tracking_id__icontains=search_query) |
                models.Q(booking__customer__full_name__icontains=search_query) |
                models.Q(booking__worker__full_name__icontains=search_query)
            )
            
        serializer = BillSerializer(bills, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminBookingBillView(APIView):
    permission_classes = (IsAdminUser,)
    
    def get(self, request, pk):
        try:
            bill = Bill.objects.get(booking_id=pk)
            return Response(BillSerializer(bill).data, status=status.HTTP_200_OK)
        except Bill.DoesNotExist:
            return Response({"detail": "Bill not found for this booking"}, status=status.HTTP_404_NOT_FOUND)


class AdminPaymentsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        payments = Payment.objects.select_related('booking', 'booking__customer', 'booking__worker').all().order_by('-created_at')
        
        search_query = request.query_params.get('search')
        if search_query:
            payments = payments.filter(
                models.Q(transaction_id__icontains=search_query) |
                models.Q(booking__tracking_id__icontains=search_query) |
                models.Q(booking__customer__full_name__icontains=search_query) |
                models.Q(booking__worker__full_name__icontains=search_query)
            )

        serializer = PaymentSerializer(payments, many=True)
        # Append nested details
        data = []
        for p in payments:
            p_data = PaymentSerializer(p).data
            p_data['customer_name'] = p.booking.customer.full_name
            p_data['worker_name'] = p.booking.worker.full_name if p.booking.worker else 'N/A'
            p_data['tracking_id'] = p.booking.tracking_id
            data.append(p_data)
            
        return Response(data, status=status.HTTP_200_OK)


class AdminRatingsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        ratings = Rating.objects.all().order_by('-created_at')
        
        rating_filter = request.query_params.get('rating')
        if rating_filter:
            ratings = ratings.filter(rating=rating_filter)

        search_query = request.query_params.get('search')
        if search_query:
            ratings = ratings.filter(
                models.Q(review__icontains=search_query) |
                models.Q(customer__full_name__icontains=search_query) |
                models.Q(worker__full_name__icontains=search_query)
            )

        data = []
        for r in ratings:
            data.append({
                'id': r.id,
                'booking_id': r.booking.id,
                'tracking_id': r.booking.tracking_id,
                'customer_name': r.customer.full_name,
                'worker_name': r.worker.full_name,
                'rating': r.rating,
                'review': r.review,
                'is_hidden': r.is_hidden,
                'created_at': r.created_at
            })
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request, pk):
        try:
            rating = Rating.objects.get(pk=pk)
        except Rating.DoesNotExist:
            return Response({"detail": "Rating not found"}, status=status.HTTP_404_NOT_FOUND)
        
        rating.is_hidden = not rating.is_hidden
        rating.save()
        return Response({
            'id': rating.id,
            'is_hidden': rating.is_hidden,
            'message': f"Review visibility set to {'hidden' if rating.is_hidden else 'visible'}."
        }, status=status.HTTP_200_OK)


class AdminReportsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        export_csv = request.query_params.get('export') == 'csv'
        
        if export_csv:
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="workizo_bookings_report.csv"'
            writer = csv.writer(response)
            writer.writerow(['Booking ID', 'Tracking ID', 'Customer', 'Captain', 'Category', 'Status', 'Grand Total', 'Created At'])

            bookings = Booking.objects.all().order_by('-created_at')
            for b in bookings:
                grand_total = 0.00
                try:
                    grand_total = float(b.bill.grand_total)
                except:
                    pass
                writer.writerow([
                    b.id,
                    b.tracking_id,
                    b.customer.full_name,
                    b.worker.full_name if b.worker else 'Not Assigned',
                    b.service_category.name,
                    b.status,
                    grand_total,
                    b.created_at.strftime('%Y-%m-%d %H:%M')
                ])
            return response
            
        # General analysis response
        total_bookings = Booking.objects.count()
        completed = Booking.objects.filter(status='completed').count()
        cancelled = Booking.objects.filter(status='cancelled').count()
        success_rate = (completed / total_bookings * 100) if total_bookings > 0 else 0
        cancel_rate = (cancelled / total_bookings * 100) if total_bookings > 0 else 0

        # High level stats grouped by category
        categories = Booking.objects.values('service_category__name') \
            .annotate(count=Count('id'), total_rev=Sum('bill__grand_total')) \
            .order_by('-count')

        data = {
            'successRate': round(success_rate, 1),
            'cancelRate': round(cancel_rate, 1),
            'categories': list(categories),
        }
        return Response(data, status=status.HTTP_200_OK)


class AdminNotificationsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        announcements = Announcement.objects.all().order_by('-created_at')
        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        title = request.data.get('title')
        message = request.data.get('message')
        recipient_type = request.data.get('recipient_type')
        recipient_user_id = request.data.get('recipient_user_id')

        if not title or not message or not recipient_type:
            return Response({"detail": "Title, message, and recipient_type are required"}, status=status.HTTP_400_BAD_REQUEST)

        recipient_user = None
        if recipient_user_id:
            try:
                recipient_user = User.objects.get(id=recipient_user_id)
            except User.DoesNotExist:
                return Response({"detail": "Recipient user not found"}, status=status.HTTP_404_NOT_FOUND)

        # 1. Create Announcement log entry
        announcement = Announcement.objects.create(
            title=title,
            message=message,
            recipient_type=recipient_type,
            recipient_user=recipient_user
        )

        # 2. Dispatch individual Notification records
        targets = []
        if recipient_type == 'all_customers':
            targets = User.objects.filter(role='customer')
        elif recipient_type == 'all_captains':
            targets = User.objects.filter(role='worker')
        elif recipient_type in ['individual_customer', 'individual_captain'] and recipient_user:
            targets = [recipient_user]

        notifications_to_create = [
            Notification(user=target, title=title, message=message, notification_type='admin_broadcast')
            for target in targets
        ]
        
        Notification.objects.bulk_create(notifications_to_create)

        return Response({
            'announcement': AnnouncementSerializer(announcement).data,
            'message': f"Announcement broadcasted to {len(targets)} users."
        }, status=status.HTTP_201_CREATED)


class AdminSettingsView(APIView):
    permission_classes = (IsAdminUser,)

    def get(self, request):
        settings_obj = SystemSetting.objects.first()
        if not settings_obj:
            # Fallback setting creation
            settings_obj = SystemSetting.objects.create(company_name='Workizo')
        serializer = SystemSettingSerializer(settings_obj)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        settings_obj = SystemSetting.objects.first()
        if not settings_obj:
            settings_obj = SystemSetting.objects.create(company_name='Workizo')
            
        serializer = SystemSettingSerializer(settings_obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated, IsAdminUser)

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        data = request.data
        if 'full_name' in data:
            user.full_name = data['full_name']
        if 'email' in data:
            user.email = data['email']
        if 'phone' in data:
            user.phone = data['phone']
        user.save()
        return Response(UserSerializer(user).data, status=status.HTTP_200_OK)

    def post(self, request):
        # Change password action
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password changed successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
