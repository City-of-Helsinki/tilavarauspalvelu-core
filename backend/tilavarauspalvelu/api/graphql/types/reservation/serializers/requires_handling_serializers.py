from __future__ import annotations

from typing import TYPE_CHECKING, Any, NotRequired, TypedDict

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

__all__ = [
    "ReservationRequiresHandlingSerializer",
]


class ReservationHandlingData(TypedDict):
    pk: int

    state: NotRequired[ReservationStateChoice]


class ReservationRequiresHandlingSerializer(NestingModelSerializer):
    """Return a reservation to handling."""

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
            "state",
        ]

    def validate(self, data: ReservationHandlingData) -> ReservationHandlingData:
        begin = self.instance.begin.astimezone(DEFAULT_TIMEZONE)
        end = self.instance.end.astimezone(DEFAULT_TIMEZONE)

        if self.instance.state == ReservationStateChoice.DENIED:
            reservation_unit: ReservationUnit = self.instance.reservation_units.first()
            reservation_unit.validators.validate_no_overlapping_reservations(begin=begin, end=end)

        self.instance.validators.validate_reservation_state_allows_handling()
        data["state"] = ReservationStateChoice.REQUIRES_HANDLING
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:
        previous_state = instance.state

        instance: Reservation = super().update(instance=instance, validated_data=validated_data)

        # If in this mutation, the reservation was changed from 'DENIED' to 'REQUIRES_HANDLING',
        # it means that the reservation is going to happen again. This is analogous to creating a new reservation,
        # so we must check for overlapping reservations again. This can fail if another reservation
        # is created (or "un-denied") for the same reservation unit at almost the same time.
        if (
            previous_state not in ReservationStateChoice.states_going_to_occur
            and instance.actions.overlapping_reservations().exists()
        ):
            instance.state = previous_state
            instance.save(update_fields=["state"])
            msg = "Overlapping reservations were created at the same time."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        # Denied reservations shouldn't have an access code. It will be regenerated if the reservation is approved.
        if instance.access_type == AccessType.ACCESS_CODE:
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.deactivate_access_code(obj=instance)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        EmailService.send_reservation_requires_handling_email(reservation=instance)
        return instance
