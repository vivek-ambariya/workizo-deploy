from rest_framework import serializers
from .models import Bill, BillItem, Payment
from bookings.serializers import BookingSerializer

class BillItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillItem
        fields = ('id', 'bill', 'part_name', 'quantity', 'price')
        read_only_fields = ('id', 'bill')

class BillSerializer(serializers.ModelSerializer):
    items = BillItemSerializer(many=True, read_only=True)
    booking_detail = BookingSerializer(source='booking', read_only=True)

    class Meta:
        model = Bill
        fields = (
            'id', 'booking', 'booking_detail', 'labour_charges', 'parts_charges',
            'gst', 'discount', 'grand_total', 'is_approved', 'invoice_pdf', 'supplier_invoice', 'items', 'created_at'
        )
        read_only_fields = ('id', 'parts_charges', 'gst', 'grand_total', 'is_approved', 'invoice_pdf', 'created_at')


class PaymentSerializer(serializers.ModelSerializer):
    payment_method = serializers.ReadOnlyField()
    payment_status = serializers.ReadOnlyField()

    class Meta:
        model = Payment
        fields = (
            'id', 'booking', 'customer', 'captain', 'amount', 'currency',
            'receipt_number', 'method', 'status', 'payment_method', 'payment_status',
            'razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature',
            'transaction_id', 'cash_confirmation_timestamp', 'payment_time',
            'created_at'
        )
        read_only_fields = ('id', 'created_at', 'payment_method', 'payment_status')

