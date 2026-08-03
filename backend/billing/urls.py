from django.urls import path
from .views import (
    GenerateBillView, GetBillView, ApproveBillView, ProcessPaymentView, DownloadInvoiceView,
    InitiateOnlinePaymentView, VerifyOnlinePaymentView, SelectCashPaymentView, ConfirmCashPaymentView, DownloadReceiptView
)

urlpatterns = [
    path('<int:booking_id>/generate-bill/', GenerateBillView.as_view(), name='generate-bill'),
    path('<int:booking_id>/get-bill/', GetBillView.as_view(), name='get-bill'),
    path('<int:booking_id>/approve-bill/', ApproveBillView.as_view(), name='approve-bill'),
    path('<int:booking_id>/process-payment/', ProcessPaymentView.as_view(), name='process-payment'),
    path('<int:booking_id>/download-invoice/', DownloadInvoiceView.as_view(), name='download-invoice'),
    path('<int:booking_id>/initiate-online-payment/', InitiateOnlinePaymentView.as_view(), name='initiate-online-payment'),
    path('<int:booking_id>/verify-online-payment/', VerifyOnlinePaymentView.as_view(), name='verify-online-payment'),
    path('<int:booking_id>/select-cash-payment/', SelectCashPaymentView.as_view(), name='select-cash-payment'),
    path('<int:booking_id>/confirm-cash-payment/', ConfirmCashPaymentView.as_view(), name='confirm-cash-payment'),
    path('<int:booking_id>/download-receipt/', DownloadReceiptView.as_view(), name='download-receipt'),
]

