from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet

router = DefaultRouter()
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('my-bookings/', BookingViewSet.as_view({'get': 'my_bookings'}), name='my-bookings-list'),
    path('available-requests/', BookingViewSet.as_view({'get': 'available_requests'}), name='available-requests-list'),
    path('', include(router.urls)),
]
