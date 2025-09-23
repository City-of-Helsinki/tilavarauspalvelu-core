from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.enums import AccessType, ReservationCancelReasonChoice, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import (
    cancel_payment_order_for_invoice_task,
    cancel_payment_order_without_webshop_payment_task,
    refund_payment_order_for_webshop_task,
)
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import external_service_errors_as_validation_errors

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder
    from tilavarauspalvelu.typing import ReservationCancellationData

__all__ = [
    "ReservationCancellationSerializer",
]


class ReservationCancellationSerializer(NestingModelSerializer):
    """Cancel a reservation."""

    instance: Reservation

    pk = IntegerField(required=True)

    cancel_reason = EnumFriendlyChoiceField(
        choices=ReservationCancelReasonChoice.user_selectable,
        enum=ReservationCancelReasonChoice,
        required=True,
    )
    cancel_details = CharField(required=False, allow_blank=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "cancel_reason",
            "cancel_details",
            "state",
        ]

    def validate(self, data: ReservationCancellationData) -> ReservationCancellationData:
        self.instance.validators.validate_reservation_state_allows_cancelling()
        self.instance.validators.validate_reservation_type_allows_cancelling()
        self.instance.validators.validate_reservation_not_past_or_ongoing()

        reservation_unit = self.instance.reservation_unit

        begin = self.instance.begins_at.astimezone(DEFAULT_TIMEZONE)

        reservation_unit.validators.validate_cancellation_rule(begin=begin)

        data["state"] = ReservationStateChoice.CANCELLED

        return data

    def update(self, instance: Reservation, validated_data: ReservationCancellationData) -> Reservation:
        with transaction.atomic():
            instance = super().update(instance=instance, validated_data=validated_data)

            if instance.access_type == AccessType.ACCESS_CODE:
                with (
                    external_service_errors_as_validation_errors(code=error_codes.PINDORA_ERROR),
                    suppress(PindoraNotFoundError),
                ):
                    PindoraService.delete_access_code(obj=instance)

        if hasattr(instance, "payment_order"):
            payment_order: PaymentOrder = instance.payment_order

            if payment_order.actions.is_refundable():
                refund_payment_order_for_webshop_task.delay(payment_order.pk)

            elif payment_order.actions.is_cancellable_invoice():
                cancel_payment_order_for_invoice_task.delay(payment_order.pk)

            elif payment_order.actions.has_no_payment_through_webshop():
                cancel_payment_order_without_webshop_payment_task.delay(payment_order.pk)

        EmailService.send_reservation_cancelled_email(reservation=instance)

        return instance
