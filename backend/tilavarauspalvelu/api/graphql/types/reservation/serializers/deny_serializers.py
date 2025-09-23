from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.models import Reservation, ReservationDenyReason
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime
from utils.external_service.errors import external_service_errors_as_validation_errors

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder
    from tilavarauspalvelu.typing import ReservationDenyData

__all__ = [
    "ReservationDenySerializer",
]


class ReservationDenySerializer(NestingModelSerializer):
    """Deny a reservation during handling."""

    instance: Reservation

    pk = IntegerField(required=True)

    deny_reason = IntegerPrimaryKeyField(queryset=ReservationDenyReason.objects, required=True)
    handling_details = CharField(required=True, allow_blank=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "deny_reason",
            "handling_details",
            "state",
            "handled_at",
        ]
        extra_kwargs = {
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationDenyData) -> ReservationDenyData:
        self.instance.validators.validate_reservation_state_allows_denying()

        if hasattr(self.instance, "payment_order"):
            payment_order: PaymentOrder = self.instance.payment_order
            order_status_before = payment_order.status

            # If refresh fails, still allow the reservation to be denied
            with suppress(GetPaymentError):
                payment_order.actions.refresh_order_status_from_webshop()

            order_status_after = payment_order.status

            if order_status_before != order_status_after and order_status_after in OrderStatus.paid_in_webshop:
                msg = "Payment order status has changed to paid. Must re-evaluate if reservation should be denied."
                raise ValidationError(msg, code=error_codes.ORDER_STATUS_CHANGED)

        data["state"] = ReservationStateChoice.DENIED
        data["handled_at"] = local_datetime()
        return data

    def update(self, instance: Reservation, validated_data: ReservationDenyData) -> Reservation:
        with transaction.atomic():
            if hasattr(instance, "payment_order"):
                payment_order: PaymentOrder = instance.payment_order

                # Refunds are made optionally through the 'refundReservation' -mutation
                if payment_order.actions.has_no_payment_through_webshop():
                    payment_order.actions.cancel_together_with_verkkokauppa(cancel_on_error=True)

            instance = super().update(instance=instance, validated_data=validated_data)

            if instance.access_type == AccessType.ACCESS_CODE:
                with (
                    external_service_errors_as_validation_errors(code=error_codes.PINDORA_ERROR),
                    suppress(PindoraNotFoundError),
                ):
                    PindoraService.delete_access_code(obj=instance)

        EmailService.send_reservation_denied_email(reservation=instance)
        return instance
