from django.urls import re_path
from bookings.consumers import BookingConsumer, ChatConsumer
from notifications.consumers import NotificationConsumer

websocket_urlpatterns = [
    re_path(r'^ws/notifications/$', NotificationConsumer.as_asgi()),
    re_path(r'^ws/bookings/(?P<booking_id>\d+)/$', BookingConsumer.as_asgi()),
    re_path(r'^ws/chat/(?P<booking_id>\d+)/$', ChatConsumer.as_asgi()),
]
