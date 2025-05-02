from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationApproveData

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationApproveSerializer(NestingModelSerializer):
    """Approve a reservation during handling."""

    instance: Reservation

    pk = IntegerField(required=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "price",
            "handling_details",
            "handled_at",
            "state",
        ]
        extra_kwargs = {
            "price": {"required": True},
            "handling_details": {"required": True},
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationApproveData) -> ReservationApproveData:
        self.instance.validators.validate_reservation_state_allows_approving()
        data["state"] = ReservationStateChoice.CONFIRMED
        data["handled_at"] = local_datetime()
        return data

    def update(self, instance: Reservation, validated_data: ReservationApproveData) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)

        if instance.access_type == AccessType.ACCESS_CODE:
            # Allow activation in Pindora to fail, will be handled by a background task.
            try:
                try:
                    PindoraService.activate_access_code(instance)
                except PindoraNotFoundError:
                    # If access code has not been generated (e.g. returned to handling after a deny and then approved),
                    # create a new active access code in Pindora.
                    PindoraService.create_access_code(instance, is_active=True)

            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        EmailService.send_reservation_approved_email(reservation=instance)
        EmailService.send_reservation_confirmed_staff_notification_email(reservation=instance)
        return instance
