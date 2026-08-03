from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from services.models import ServiceCategory, Rating
from services.serializers import ServiceCategorySerializer
from bookings.models import Booking

class ListServiceCategoriesView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request):
        categories = ServiceCategory.objects.all().order_by('name')
        serializer = ServiceCategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class SubmitRatingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        booking_id = request.data.get('booking_id')
        rating_value = request.data.get('rating')
        review_text = request.data.get('review', '')

        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "You cannot rate this booking."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status != 'completed':
            return Response({"detail": "You can only rate completed services."}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(booking, 'rating'):
            return Response({"detail": "This service has already been rated."}, status=status.HTTP_400_BAD_REQUEST)

        rating = Rating.objects.create(
            booking=booking,
            customer=request.user,
            worker=booking.worker,
            rating=rating_value,
            review=review_text
        )

        return Response({
            "status": "success",
            "rating": rating_value,
            "review": review_text
        }, status=status.HTTP_201_CREATED)
