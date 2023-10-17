from rest_framework import routers

from .views import WebhookOrderViewSet, WebhookPaymentViewSet, WebhookRefundViewSet

webhook_router = routers.DefaultRouter()

webhook_router.register(r"payment", WebhookPaymentViewSet, "payment")
webhook_router.register(r"order", WebhookOrderViewSet, "order")
webhook_router.register(r"refund", WebhookRefundViewSet, "refund")
