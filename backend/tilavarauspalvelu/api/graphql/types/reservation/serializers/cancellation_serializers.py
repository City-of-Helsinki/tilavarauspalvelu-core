from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import Reservation, ReservationCancelReason
from tilavarauspalvelu.tasks import cancel_reservation_invoice_task, refund_paid_reservation_task
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import external_service_errors_as_validation_errors

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
        self.instance.validators.validate_reservation_state_allows_cancelling()
        self.instance.validators.validate_reservation_type_allows_cancelling()
        self.instance.validators.validate_reservation_not_past_or_ongoing()
        self.instance.validators.validate_single_reservation_unit()

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        begin = self.instance.begin.astimezone(DEFAULT_TIMEZONE)

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

        if instance.actions.is_refundable:
            refund_paid_reservation_task.delay(instance.pk)
        elif instance.actions.is_cancellable_invoice:
            cancel_reservation_invoice_task.delay(instance.pk)

        EmailService.send_reservation_cancelled_email(reservation=instance)

        return instance
