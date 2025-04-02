from __future__ import annotations

from typing import TYPE_CHECKING, Any, NamedTuple

from graphene_django_extensions.bases import DjangoMutation
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.models import PaymentOrder

from .permissions import OrderRefreshPermission
from .serializers import RefreshOrderInputSerializer, RefreshOrderOutputSerializer

if TYPE_CHECKING:
    import uuid

    from tilavarauspalvelu.typing import GQLInfo


class RefreshOrderMutationOutput(NamedTuple):
    order_uuid: uuid.UUID
    status: str
    reservation_pk: int


class RefreshOrderMutation(DjangoMutation):
    class Meta:
        model = PaymentOrder  # Required for "frontend query to factory" matching (see. 'match_queries_to_factories')
        serializer_class = RefreshOrderInputSerializer
        output_serializer_class = RefreshOrderOutputSerializer
        permission_classes = [OrderRefreshPermission]

    @classmethod
    def custom_mutation(cls, info: GQLInfo, input_data: dict[str, Any]) -> RefreshOrderMutationOutput:
        remote_id: uuid.UUID = input_data["order_uuid"]

        payment_order: PaymentOrder | None = PaymentOrder.objects.filter(remote_id=remote_id).first()
        if not payment_order:
            msg = "Order not found"
            raise ValidationError(msg, code=error_codes.NOT_FOUND)

        if payment_order.status not in OrderStatus.needs_update_statuses:
            return RefreshOrderMutationOutput(
                order_uuid=payment_order.remote_id,
                status=payment_order.status,
                reservation_pk=payment_order.reservation.pk,
            )

        try:
            webshop_payment = payment_order.actions.get_order_payment_from_webshop()
            if not webshop_payment:
                SentryLogger.log_message(
                    message="Verkkokauppa: Order payment check failed",
                    details=f"Order payment check failed: payment not found ({remote_id}).",
                    level="warning",
                )
                msg = "Unable to check order payment"
                raise ValidationError(msg, code=error_codes.NOT_FOUND)

        except GetPaymentError as error:
            msg = "Unable to check order payment: problem with external service"
            raise ValidationError(msg, code=error_codes.EXTERNAL_SERVICE_ERROR) from error

        new_status: OrderStatus = payment_order.actions.get_order_status_from_webshop_response(webshop_payment)
        if new_status in {OrderStatus.CANCELLED, OrderStatus.PAID}:
            payment_order.actions.update_order_status(new_status, webshop_payment.payment_id)

        return RefreshOrderMutationOutput(
            order_uuid=payment_order.remote_id,
            status=payment_order.status,
            reservation_pk=payment_order.reservation.pk,
        )
