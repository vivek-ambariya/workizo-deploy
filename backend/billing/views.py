import io
import json
import time
import hmac
import hashlib
import requests
from decimal import Decimal
from django.shortcuts import get_object_or_404
from django.http import FileResponse, Http404
from django.core.files.base import ContentFile
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from rest_framework import views, permissions, status
from rest_framework.response import Response
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Bill, BillItem, Payment
from .serializers import BillSerializer, PaymentSerializer
from bookings.models import Booking
from bookings.serializers import BookingSerializer
from bookings.views import send_booking_update, create_and_send_notification
from notifications.email_service import EmailNotificationService

# ReportLab Invoice Imports
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def compile_bill_pdf(bill):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F0F14'),
        spaceAfter=12
    )
    normal_style = styles['Normal']
    
    story = []
    story.append(Paragraph("WORKIZO OFFICIAL INVOICE", title_style))
    story.append(Spacer(1, 10))
    
    # Metadata
    story.append(Paragraph(f"<b>Invoice No:</b> WRK-INV-{bill.id}", normal_style))
    story.append(Paragraph(f"<b>Booking Ref:</b> #{bill.booking.id}", normal_style))
    story.append(Paragraph(f"<b>Customer:</b> {bill.booking.customer.full_name} ({bill.booking.customer.phone})", normal_style))
    worker_name = bill.booking.worker.full_name if bill.booking.worker else "Unassigned"
    story.append(Paragraph(f"<b>Captain:</b> {worker_name}", normal_style))
    story.append(Paragraph(f"<b>Service Category:</b> {bill.booking.service_category.name}", normal_style))
    story.append(Paragraph(f"<b>Date:</b> {bill.created_at.strftime('%Y-%m-%d %H:%M')}", normal_style))
    story.append(Spacer(1, 20))
    
    # Table columns: Description, Qty, Rate, Total
    table_data = [
        [
            Paragraph("<b>Item Description</b>", normal_style), 
            Paragraph("<b>Quantity</b>", normal_style), 
            Paragraph("<b>Price</b>", normal_style), 
            Paragraph("<b>Amount</b>", normal_style)
        ]
    ]
    
    # Labour charges
    table_data.append([
        Paragraph("Labour / Service Fee", normal_style), 
        "1", 
        f"INR {bill.labour_charges}", 
        f"INR {bill.labour_charges}"
    ])
    
    # Spare parts items
    for item in bill.items.all():
        item_total = item.price * item.quantity
        table_data.append([
            Paragraph(item.part_name, normal_style), 
            str(item.quantity), 
            f"INR {item.price}", 
            f"INR {item_total}"
        ])
        
    # Divider blank line
    table_data.append(["", "", "", ""])
    
    # Totals breakdown
    parts_sub = bill.parts_charges
    subtotal = bill.labour_charges + parts_sub
    table_data.append(["", "", Paragraph("<b>Subtotal:</b>", normal_style), f"INR {subtotal}"])
    table_data.append(["", "", Paragraph("<b>GST (18%):</b>", normal_style), f"INR {bill.gst}"])
    table_data.append(["", "", Paragraph("<b>Discount:</b>", normal_style), f"-INR {bill.discount}"])
    table_data.append(["", "", Paragraph("<b>Grand Total:</b>", normal_style), f"INR {bill.grand_total}"])
    
    items_count = bill.items.count()
    grid_end_row = 1 + items_count
    discount_row = 5 + items_count

    t = Table(table_data, colWidths=[240, 60, 100, 100])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FAFAFB')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('GRID', (0,0), (-1, grid_end_row), 0.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (2, discount_row), (-1, discount_row), 1, colors.HexColor('#0F0F14')),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing WORKIZO. For queries, contact workizo24.7@gmail.com", normal_style))
    
    doc.build(story)
    
    buffer.seek(0)
    pdf_file = ContentFile(buffer.read())
    bill.invoice_pdf.save(f"invoice_{bill.booking.id}.pdf", pdf_file)
    bill.save()

class GenerateBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if request.user.role != 'worker' or booking.worker != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
        
        if booking.status in ['searching', 'cancelled', 'completed']:
            return Response({"detail": f"Cannot generate bill for booking in '{booking.status}' status."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if bill already exists
        if hasattr(booking, 'bill'):
            return Response({"detail": "Bill already generated for this booking."}, status=status.HTTP_400_BAD_REQUEST)

        import json
        raw_data = request.data.get('data')
        parsed_data = {}
        if raw_data:
            if isinstance(raw_data, str):
                try:
                    parsed_data = json.loads(raw_data)
                except Exception:
                    pass
            else:
                parsed_data = raw_data
        else:
            parsed_data = request.data

        labour_charges = Decimal(str(parsed_data.get('labour_charges', 0) or 0))
        discount = Decimal(str(parsed_data.get('discount', 0) or 0))
        
        if labour_charges < 0:
            return Response({"detail": "Labour charges cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
        if discount < 0:
            return Response({"detail": "Discount cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)

        items_data = parsed_data.get('parts_used') or parsed_data.get('items') or []
        if isinstance(items_data, str):
            try:
                items_data = json.loads(items_data)
            except Exception:
                items_data = []

        # Validate spare parts before creating the bill database row
        preview_parts_charges = Decimal('0.00')
        for item in items_data:
            name = item.get('part_name')
            if name:
                try:
                    qty = int(item.get('quantity', 1))
                except (ValueError, TypeError):
                    return Response({"detail": "Quantity must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    price = Decimal(str(item.get('price', 0)))
                except Exception:
                    return Response({"detail": "Price must be a valid decimal number."}, status=status.HTTP_400_BAD_REQUEST)

                if qty <= 0:
                    return Response({"detail": "Spare part quantity must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)
                if price < 0:
                    return Response({"detail": "Spare part price cannot be negative."}, status=status.HTTP_400_BAD_REQUEST)
                
                preview_parts_charges += (price * qty)

        subtotal_preview = labour_charges + preview_parts_charges
        gst_preview = (subtotal_preview * Decimal('0.18')).quantize(Decimal('0.01'))
        if discount > (subtotal_preview + gst_preview):
            return Response({"detail": f"Discount (₹{discount}) cannot exceed total bill amount (₹{subtotal_preview + gst_preview})."}, status=status.HTTP_400_BAD_REQUEST)

        supplier_invoice = request.FILES.get('supplier_invoice')

        # Create Bill (charges calculated below)
        bill = Bill.objects.create(
            booking=booking,
            labour_charges=labour_charges,
            discount=discount,
            supplier_invoice=supplier_invoice
        )

        parts_charges = Decimal('0.00')
        for item in items_data:
            name = item.get('part_name')
            qty = int(item.get('quantity', 1))
            price = Decimal(str(item.get('price', 0)))
            
            if name:
                BillItem.objects.create(
                    bill=bill,
                    part_name=name,
                    quantity=qty,
                    price=price
                )
                parts_charges += (price * qty)

        # Set final aggregates
        subtotal = labour_charges + parts_charges
        gst = (subtotal * Decimal('0.18')).quantize(Decimal('0.01'))
        grand_total = (subtotal + gst - discount).quantize(Decimal('0.01'))
        if grand_total < 0:
            grand_total = Decimal('0.00')

        bill.parts_charges = parts_charges
        bill.gst = gst
        bill.grand_total = grand_total
        bill.save()

        # Compile PDF invoice automatically
        compile_bill_pdf(bill)

        # Update booking status & broadcast
        if bill.grand_total == 0:
            from django.utils import timezone
            import time
            payment = Payment.objects.create(
                booking=booking,
                customer=booking.customer,
                captain=booking.worker,
                amount=Decimal('0.00'),
                currency='INR',
                receipt_number=f"REC-{booking.id}-{int(time.time())}",
                method='CASH',
                status='PAID',
                payment_time=timezone.now()
            )
            compile_receipt_pdf(payment)
            booking.status = 'ready_to_complete'
        else:
            booking.status = 'waiting_approval'
        booking.save()

        booking_data = BookingSerializer(booking).data
        event_type = 'payment_completed' if bill.grand_total == 0 else 'payment_pending'
        send_booking_update(booking.id, booking_data, event_type)

        # Alert customer
        create_and_send_notification(
            user=booking.customer,
            title="Invoice Generated",
            message=f"Captain has generated an invoice for ₹{grand_total}. Please review and pay.",
            notification_type="bill"
        )

        # Send Work Completed Email to Customer
        from notifications.email_service import EmailNotificationService
        EmailNotificationService.send_work_completed_email(booking, bill)

        # Send Service Completed Email to Captain if free job (grand total 0 completes instantly)
        if bill.grand_total == 0:
            EmailNotificationService.send_captain_service_completed_email(booking)

        return Response(BillSerializer(bill).data, status=status.HTTP_201_CREATED)

class GetBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        bill = get_object_or_404(Bill, booking=booking)
        
        if request.user != booking.customer and request.user != booking.worker:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)
            
        return Response(BillSerializer(bill).data)

class ApproveBillView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.is_approved:
            return Response({"detail": "This bill is already approved."}, status=status.HTTP_400_BAD_REQUEST)
        bill.is_approved = True
        bill.save()

        # Broadcast update
        send_booking_update(booking.id, BookingSerializer(booking).data)

        create_and_send_notification(
            user=booking.worker,
            title="Invoice Approved",
            message=f"Customer approved invoice for booking #{booking.id}. Awaiting payment.",
            notification_type="bill"
        )

        return Response(BillSerializer(bill).data)

def compile_receipt_pdf(payment):
    booking = payment.booking
    bill = booking.bill
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F0F14'),
        spaceAfter=12
    )
    normal_style = styles['Normal']
    
    story = []
    story.append(Paragraph("WORKIZO OFFICIAL RECEIPT", title_style))
    story.append(Spacer(1, 10))
    
    # Metadata
    receipt_no = payment.receipt_number if payment.receipt_number else f"REC-{booking.id}"
    story.append(Paragraph(f"<b>Receipt No:</b> {receipt_no}", normal_style))
    story.append(Paragraph(f"<b>Booking Ref:</b> #{booking.id}", normal_style))
    story.append(Paragraph(f"<b>Tracking ID:</b> {booking.tracking_id or 'N/A'}", normal_style))
    story.append(Paragraph(f"<b>Customer Name:</b> {booking.customer.full_name}", normal_style))
    story.append(Paragraph(f"<b>Captain Name:</b> {booking.worker.full_name if booking.worker else 'N/A'}", normal_style))
    story.append(Paragraph(f"<b>Service Category:</b> {booking.service_category.name}", normal_style))
    story.append(Paragraph(f"<b>Payment Method:</b> {payment.get_method_display()}", normal_style))
    story.append(Paragraph(f"<b>Payment Status:</b> {payment.get_status_display()}", normal_style))
    
    if payment.method == 'ONLINE' and payment.transaction_id:
        story.append(Paragraph(f"<b>Transaction ID:</b> {payment.transaction_id}", normal_style))
    elif payment.method == 'CASH' and payment.cash_confirmation_timestamp:
        story.append(Paragraph(f"<b>Cash Confirmation Time:</b> {payment.cash_confirmation_timestamp.strftime('%Y-%m-%d %H:%M')}", normal_style))
        
    story.append(Paragraph(f"<b>Payment Date & Time:</b> {payment.payment_time.strftime('%Y-%m-%d %H:%M') if payment.payment_time else 'N/A'}", normal_style))
    story.append(Spacer(1, 20))
    
    # Charges table
    table_data = [
        [
            Paragraph("<b>Item Description</b>", normal_style), 
            Paragraph("<b>Amount</b>", normal_style)
        ]
    ]
    
    # Labour charges
    table_data.append([
        Paragraph("Labour / Service Fee", normal_style), 
        f"INR {bill.labour_charges}"
    ])
    
    # Spare parts charges
    table_data.append([
        Paragraph("Spare Parts & Materials Fee", normal_style), 
        f"INR {bill.parts_charges}"
    ])
    
    # GST
    table_data.append([
        Paragraph("GST (18% inclusive)", normal_style), 
        f"INR {bill.gst}"
    ])
    
    if bill.discount > 0:
        table_data.append([
            Paragraph("Promo Discount", normal_style), 
            f"-INR {bill.discount}"
        ])
        
    table_data.append([
        Paragraph("<b>Grand Total Paid:</b>", normal_style), 
        f"INR {payment.amount}"
    ])
    
    t = Table(table_data, colWidths=[350, 150])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FAFAFB')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('LINEBELOW', (0,-2), (-1,-1), 1.5, colors.HexColor('#0F0F14')),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 30))
    story.append(Paragraph("Thank you for choosing WORKIZO. For queries, contact workizo24.7@gmail.com", normal_style))
    
    doc.build(story)
    buffer.seek(0)
    
    pdf_file = ContentFile(buffer.read())
    payment.receipt_pdf.save(f"receipt_{booking.id}.pdf", pdf_file)
    payment.save()

class InitiateOnlinePaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.grand_total > 0 and not bill.is_approved:
            return Response({"detail": "Bill invoice must be approved by customer before initiating payment."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent duplicate paid online transactions
        existing_payment = Payment.objects.filter(booking=booking).first()
        if existing_payment and existing_payment.status in ['PAID', 'COMPLETED', 'success']:
            return Response({"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_number = f"REC-{booking.id}-{int(time.time())}"
        amount_in_paise = int(bill.grand_total * 100)

        # Call Razorpay API to create order
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_number
        }
        
        rzp_order_id = None
        try:
            # Only hit Razorpay if not in dummy mode or if secrets look real
            if settings.RAZORPAY_KEY_ID != 'rzp_test_51O2p3D4R5S6T7U' and settings.RAZORPAY_KEY_SECRET != 'dummy_secret_value':
                response = requests.post(
                    "https://api.razorpay.com/v1/orders",
                    auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
                    json=order_data,
                    timeout=10
                )
                if response.status_code == 200:
                    rzp_order_id = response.json().get("id")
        except Exception:
            pass

        # Fallback order ID for testing mode
        if not rzp_order_id:
            rzp_order_id = f"order_mock_{booking.id}_{int(time.time())}"

        # Update or create Payment in database
        payment, _ = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                'customer': booking.customer,
                'captain': booking.worker,
                'amount': bill.grand_total,
                'currency': 'INR',
                'receipt_number': receipt_number,
                'method': 'ONLINE',
                'status': 'PENDING',
                'razorpay_order_id': rzp_order_id,
            }
        )

        return Response({
            "order_id": rzp_order_id,
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": receipt_number,
            "key_id": settings.RAZORPAY_KEY_ID
        })

class VerifyOnlinePaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_signature = request.data.get('razorpay_signature')
        payment_status = request.data.get('status') # optional override for failure simulation

        if payment_status == 'FAILED':
            payment = Payment.objects.filter(booking=booking, razorpay_order_id=razorpay_order_id).first()
            if payment:
                payment.status = 'FAILED'
                payment.save()
            send_booking_update(booking.id, BookingSerializer(booking).data, 'payment_failed')
            return Response({"detail": "Payment recorded as failed."}, status=status.HTTP_400_BAD_REQUEST)

        # Signature verification
        is_verified = False
        if not razorpay_signature or (razorpay_order_id and razorpay_order_id.startswith("order_mock_")) or (razorpay_payment_id and str(razorpay_payment_id).startswith("pay_mock_")):
            # Mock validation succeeds automatically for testing/mock order ID
            is_verified = True
        elif razorpay_order_id and razorpay_payment_id and razorpay_signature:
            msg = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            is_verified = hmac.compare_digest(generated, razorpay_signature)
        elif settings.DEBUG or getattr(settings, 'RAZORPAY_KEY_ID', '').startswith('rzp_test_'):
            is_verified = True

        if not is_verified:
            # Record failed payment
            payment = Payment.objects.filter(booking=booking).last()
            if payment:
                payment.status = 'FAILED'
                payment.save()
            send_booking_update(booking.id, BookingSerializer(booking).data, 'payment_failed')
            return Response({"detail": "Invalid Razorpay payment signature."}, status=status.HTTP_400_BAD_REQUEST)

        # Process successful payment
        with transaction.atomic():  # type: ignore
            payment = Payment.objects.filter(booking=booking).order_by('-created_at').first()
            if not payment:
                bill = getattr(booking, 'bill', None)
                amount = bill.grand_total if bill else Decimal('0.00')
                payment = Payment.objects.create(
                    booking=booking,
                    customer=booking.customer,
                    captain=booking.worker,
                    amount=amount,
                    currency='INR',
                    receipt_number=f"REC-{booking.id}-{int(time.time())}",
                    method='ONLINE',
                    status='PENDING'
                )

            # Update Payment info
            payment.status = 'PAID'
            if razorpay_payment_id:
                payment.razorpay_payment_id = razorpay_payment_id
                payment.transaction_id = razorpay_payment_id
            if razorpay_signature:
                payment.razorpay_signature = razorpay_signature
            if razorpay_order_id:
                payment.razorpay_order_id = razorpay_order_id
            payment.payment_time = timezone.now()
            payment.save()

            # Update Booking status
            booking.status = 'ready_to_complete'
            booking.save()

        # Dispatch real-time WebSocket signals
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'payment_completed')

        # Push Notification
        create_and_send_notification(
            user=booking.customer,
            title="Payment Successful",
            message=f"Online payment of ₹{payment.amount} verified successfully.",
            notification_type="payment"
        )
        create_and_send_notification(
            user=booking.worker,
            title="Payment Received",
            message=f"Payment of ₹{payment.amount} received. You can now mark the job as completed.",
            notification_type="payment"
        )

        # Notify admin of payment event
        channel_layer = get_channel_layer()
        if channel_layer:
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

        # Send emails via existing SMTP system
        EmailNotificationService.send_payment_receipt_email(booking, payment)
        EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)

        return Response(PaymentSerializer(payment).data)

class SelectCashPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        if bill.grand_total > 0 and not bill.is_approved:
            return Response({"detail": "Bill invoice must be approved by customer before selecting payment method."}, status=status.HTTP_400_BAD_REQUEST)

        # Prevent selecting cash if payment is already complete
        existing_payment = Payment.objects.filter(booking=booking).first()
        if existing_payment and existing_payment.status in ['PAID', 'COMPLETED', 'success']:
            return Response({"detail": "This booking has already been paid."}, status=status.HTTP_400_BAD_REQUEST)

        receipt_number = f"REC-{booking.id}-{int(time.time())}"

        # Create or update Payment
        payment, _ = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                'customer': booking.customer,
                'captain': booking.worker,
                'amount': bill.grand_total,
                'currency': 'INR',
                'receipt_number': receipt_number,
                'method': 'CASH',
                'status': 'WAITING_FOR_CASH_CONFIRMATION'
            }
        )

        # Set booking status
        booking.status = 'WAITING_FOR_CASH_CONFIRMATION'
        booking.save()

        # Broadcast update
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'cash_selected')

        # Alert Captain that cash confirmation is pending
        create_and_send_notification(
            user=booking.worker,
            title="Cash Payment Pending",
            message=f"Customer selected Cash Payment. Please confirm receipt of ₹{bill.grand_total} after work completion.",
            notification_type="payment"
        )

        return Response(PaymentSerializer(payment).data)

class ConfirmCashPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        with transaction.atomic():  # type: ignore
            booking = Booking.objects.select_for_update().get(id=booking_id)
            if request.user.role != 'worker' or booking.worker != request.user:
                return Response({"detail": "Access denied. Only the assigned captain can confirm cash payment."}, status=status.HTTP_403_FORBIDDEN)

            if booking.status == 'completed':
                return Response({"detail": "This booking is already completed."}, status=status.HTTP_400_BAD_REQUEST)

            payment = get_object_or_404(Payment.objects.select_for_update(), booking=booking)
            
            # Prevent duplicate cash confirmation
            if payment.status in ['PAID', 'COMPLETED', 'success']:
                return Response(PaymentSerializer(payment).data)

            # Update Payment info
            payment.status = 'PAID'
            payment.payment_time = timezone.now()
            payment.cash_confirmation_timestamp = timezone.now()
            payment.save()

            # Update Booking status
            booking.status = 'ready_to_complete'
            booking.save()

        # Broadcast update
        booking_data = BookingSerializer(booking).data
        send_booking_update(booking.id, booking_data, 'payment_completed')

        # Push Notification
        create_and_send_notification(
            user=booking.customer,
            title="Cash Confirmed",
            message=f"Captain confirmed cash payment of ₹{payment.amount}. Awaiting job completion.",
            notification_type="payment"
        )
        create_and_send_notification(
            user=booking.worker,
            title="Cash Confirmed",
            message=f"You confirmed cash payment of ₹{payment.amount}. You can now complete the job.",
            notification_type="payment"
        )

        # Notify admin
        channel_layer = get_channel_layer()
        if channel_layer:
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

        return Response(PaymentSerializer(payment).data)

class DownloadReceiptView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(Payment, booking=booking)

        if request.user != booking.customer and request.user != booking.worker and not (request.user.role == 'admin' or request.user.is_staff):
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if not payment.receipt_pdf:
            if payment.status in ['PAID', 'COMPLETED', 'success']:
                compile_receipt_pdf(payment)
            else:
                raise Http404("Receipt PDF not found.")

        return FileResponse(payment.receipt_pdf.open(), content_type='application/pdf')

class DownloadInvoiceView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        bill = get_object_or_404(Bill, booking=booking)
        
        if request.user != booking.customer and request.user != booking.worker:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if not bill.invoice_pdf:
            raise Http404("Invoice PDF file not found.")

        return FileResponse(bill.invoice_pdf.open(), content_type='application/pdf')

class ProcessPaymentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        if booking.customer != request.user:
            return Response({"detail": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

        if booking.status == 'completed':
            return Response({"detail": "This booking is already completed and paid."}, status=status.HTTP_400_BAD_REQUEST)

        bill = get_object_or_404(Bill, booking=booking)
        method = request.data.get('method', 'cash')
        
        if method == 'cash':
            # route to cash selection flow
            view = SelectCashPaymentView()
            return view.post(request, booking_id)
        else:
            # mock payment receipt
            receipt_number = f"REC-{booking.id}-{int(time.time())}"
            with transaction.atomic():  # type: ignore
                payment, _ = Payment.objects.update_or_create(
                    booking=booking,
                    defaults={
                        'customer': booking.customer,
                        'captain': booking.worker,
                        'amount': bill.grand_total,
                        'currency': 'INR',
                        'receipt_number': receipt_number,
                        'method': 'ONLINE',
                        'status': 'PAID',
                        'payment_time': timezone.now()
                    }
                )
                booking.status = 'ready_to_complete'
                booking.save()
                compile_receipt_pdf(payment)

            # Broadcast and emails
            booking_data = BookingSerializer(booking).data
            send_booking_update(booking.id, booking_data, 'payment_completed')

            create_and_send_notification(
                user=booking.customer,
                title="Payment Successful",
                message=f"Mock payment of ₹{payment.amount} completed successfully.",
                notification_type="payment"
            )
            create_and_send_notification(
                user=booking.worker,
                title="Payment Received",
                message=f"Payment of ₹{payment.amount} received. You can now mark the job as completed.",
                notification_type="payment"
            )

            EmailNotificationService.send_payment_receipt_email(booking, payment)
            EmailNotificationService.send_captain_payment_confirmation_email(booking, payment)

            return Response(PaymentSerializer(payment).data)



