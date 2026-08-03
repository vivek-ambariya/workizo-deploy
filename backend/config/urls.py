"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import GoogleLoginView
from workers.views import OCRExtractView
from bookings.views import ChatMessagesView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/ocr/extract-document/', OCRExtractView.as_view(), name='ocr_extract'),
    path('api/auth/google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('api/accounts/', include('accounts.urls')),
    path('api/services/', include('services.urls')),
    path('api/workers/', include('workers.urls')),
    path('api/bookings/', include('bookings.urls')),
    path('api/billing/', include('billing.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/chat/<int:booking_id>/', ChatMessagesView.as_view(), name='chat-history'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
