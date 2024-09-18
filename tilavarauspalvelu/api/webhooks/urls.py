from rest_framework import routers

from .views import WebhookOrderCancelViewSet, WebhookOrderPaidViewSet, WebhookRefundViewSet

webhook_router = routers.DefaultRouter()

webhook_router.register(r"payment", WebhookOrderPaidViewSet, "payment")
webhook_router.register(r"order", WebhookOrderCancelViewSet, "order")
webhook_router.register(r"refund", WebhookRefundViewSet, "refund")
