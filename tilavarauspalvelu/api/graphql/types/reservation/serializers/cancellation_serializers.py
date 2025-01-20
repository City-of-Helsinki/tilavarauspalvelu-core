from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation, ReservationCancelReason
from tilavarauspalvelu.tasks import refund_paid_reservation_task
from utils.date_utils import DEFAULT_TIMEZONE

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import ReservationCancellationData

__all__ = [
    "ReservationCancellationSerializer",
]


class ReservationCancellationSerializer(NestingModelSerializer):
    """Cancel a reservation."""

    instance: Reservation

    pk = IntegerField(required=True)

    cancel_reason = IntegerPrimaryKeyField(queryset=ReservationCancelReason.objects, required=True)
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
        self.instance.validator.validate_reservation_state_allows_cancelling()
        self.instance.validator.validate_reservation_type_allows_cancelling()
        self.instance.validator.validate_reservation_not_past_or_ongoing()
        self.instance.validator.validate_single_reservation_unit()

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        begin = self.instance.begin.astimezone(DEFAULT_TIMEZONE)

        reservation_unit.validator.validate_cancellation_rule(begin=begin)

        data["state"] = ReservationStateChoice.CANCELLED

        return data

    def update(self, instance: Reservation, validated_data: ReservationCancellationData) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)

        if instance.actions.is_refundable and instance.price_net > 0:
            refund_paid_reservation_task.delay(instance.pk)

        EmailService.send_reservation_cancelled_email(reservation=instance)

        return instance
