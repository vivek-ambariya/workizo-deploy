from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import (
    RegisterView, CustomTokenObtainPairView, LogoutView,
    CurrentUserView, UpdateProfileView, ChangePasswordView,
    VerifyEmailView, ForgotPasswordView, ResetPasswordConfirmView
)
from accounts.admin_views import (
    AdminListCustomersView, AdminListWorkersView,
    AdminVerifyWorkerView, AdminToggleUserActiveView,
    AdminDashboardStatsView, AdminBookingsView, AdminBookingDetailView,
    AdminWorkerDetailView, AdminCustomerDetailView, AdminCategoryView,
    AdminBillsView, AdminBookingBillView, AdminPaymentsView, AdminRatingsView,
    AdminReportsView, AdminNotificationsView, AdminSettingsView, AdminProfileView
)

urlpatterns = [
    # General auth
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/<str:uidb64>/<str:token>/', ResetPasswordConfirmView.as_view(), name='password_reset_confirm'),
    
    # User profile
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('profile/', UpdateProfileView.as_view(), name='update_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # Admin actions
    path('admin/customers/', AdminListCustomersView.as_view(), name='admin_customers'),
    path('admin/customers/<int:pk>/', AdminCustomerDetailView.as_view(), name='admin_customer_detail'),
    path('admin/workers/', AdminListWorkersView.as_view(), name='admin_workers'),
    path('admin/workers/<int:pk>/', AdminWorkerDetailView.as_view(), name='admin_worker_detail'),
    path('admin/workers/<int:pk>/verify/', AdminVerifyWorkerView.as_view(), name='admin_verify_worker'),
    path('admin/users/<int:pk>/toggle-active/', AdminToggleUserActiveView.as_view(), name='admin_toggle_user_active'),
    
    # New Admin Dash
    path('admin/dashboard/stats/', AdminDashboardStatsView.as_view(), name='admin_dashboard_stats'),
    path('admin/bookings/', AdminBookingsView.as_view(), name='admin_bookings'),
    path('admin/bookings/<int:pk>/', AdminBookingDetailView.as_view(), name='admin_booking_detail'),
    path('admin/bookings/<int:pk>/bill/', AdminBookingBillView.as_view(), name='admin_booking_bill'),
    path('admin/categories/', AdminCategoryView.as_view(), name='admin_categories'),
    path('admin/categories/<int:pk>/', AdminCategoryView.as_view(), name='admin_category_detail'),
    path('admin/bills/', AdminBillsView.as_view(), name='admin_bills'),
    path('admin/payments/', AdminPaymentsView.as_view(), name='admin_payments'),
    path('admin/ratings/', AdminRatingsView.as_view(), name='admin_ratings'),
    path('admin/ratings/<int:pk>/hide/', AdminRatingsView.as_view(), name='admin_ratings_hide'),
    path('admin/reports/', AdminReportsView.as_view(), name='admin_reports'),
    path('admin/notifications/', AdminNotificationsView.as_view(), name='admin_notifications'),
    path('admin/settings/', AdminSettingsView.as_view(), name='admin_settings'),
    path('admin/profile/', AdminProfileView.as_view(), name='admin_profile'),
]
