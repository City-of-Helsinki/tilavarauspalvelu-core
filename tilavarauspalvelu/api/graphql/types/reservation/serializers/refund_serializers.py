from __future__ import annotations

from decimal import Decimal
from typing import Any

from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeySerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.models import PaymentOrder, Reservation
from tilavarauspalvelu.tasks import refund_paid_reservation_task
from utils.date_utils import local_datetime
from utils.utils import comma_sep_str


class ReservationRefundSerializer(OldPrimaryKeySerializer):
    instance: Reservation

    class Meta:
        model = Reservation
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        now = local_datetime()
        if self.instance.price_net <= Decimal("0.0"):
            msg = "Only reservations with price greater than 0 can be refunded."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.REFUND_NOT_ALLOWED)

        valid_states = [ReservationStateChoice.CANCELLED.value, ReservationStateChoice.DENIED.value]

        if self.instance.state not in valid_states and self.instance.end >= now:
            values = comma_sep_str(valid_states, last_sep="or", quote=True)
            msg = f"Only reservations in the past or in state {values} can be refunded."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.REFUND_NOT_ALLOWED)

        payment_order = PaymentOrder.objects.filter(
            reservation=self.instance,
            status=OrderStatus.PAID,
            refund_id__isnull=True,
        ).first()
        if not payment_order:
            msg = "Only reservations with paid order can be refunded."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.REFUND_NOT_ALLOWED)

        return super().validate(data)

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        refund_paid_reservation_task.delay(instance.pk)
        return instance
