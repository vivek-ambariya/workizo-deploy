from django.urls import path
from services.views import ListServiceCategoriesView, SubmitRatingView

urlpatterns = [
    path('categories/', ListServiceCategoriesView.as_view(), name='list_categories'),
    path('rate-booking/', SubmitRatingView.as_view(), name='rate_booking'),
]
