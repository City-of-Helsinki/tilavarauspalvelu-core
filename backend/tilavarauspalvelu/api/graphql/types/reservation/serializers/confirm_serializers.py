from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import ReservationConfirmData


__all__ = [
    "ReservationConfirmSerializer",
]


class ReservationConfirmSerializer(NestingModelSerializer):
    """Confirm a tentative reservation. Reservation might still require handling and/or payment."""

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

    def validate(self, data: ReservationConfirmData) -> ReservationConfirmData:
        self.instance.validators.validate_can_change_reservation()
        self.instance.validators.validate_no_payment_order()
        self.instance.validators.validate_required_metadata_fields()
        self.instance.validators.validate_single_reservation_unit()

        data["confirmed_at"] = local_datetime()

        # If no payment is required, we can skip the rest of the validation.
        if self.instance.price_net == 0:
            data["payment_type"] = None
            data["state"] = self.instance.actions.get_state_on_reservation_confirmed(payment_type=None)
            return data

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()
        pricing = reservation_unit.actions.get_active_pricing(by_date=self.instance.begin.date())

        if pricing is None:
            msg = "No pricing found for the given date."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

        pricing.validators.validate_has_payment_type()

        data["payment_type"] = PaymentType(pricing.payment_type)

        if pricing.payment_type != PaymentType.ON_SITE:
            reservation_unit.validators.validate_has_payment_product()

        data["state"] = self.instance.actions.get_state_on_reservation_confirmed(payment_type=data["payment_type"])

        return data

    def update(self, instance: Reservation, validated_data: ReservationConfirmData) -> Reservation:
        state = validated_data["state"]

        if self.instance.price_net > 0 and state.should_create_payment_order:
            self.instance.actions.create_payment_order_paid_immediately(payment_type=validated_data["payment_type"])

        instance = super().update(instance=instance, validated_data=validated_data)

        if instance.state == ReservationStateChoice.CONFIRMED:
            if instance.access_type == AccessType.ACCESS_CODE:
                # Allow activation in Pindora to fail, will be handled by a background task.
                try:
                    PindoraService.activate_access_code(obj=instance)
                except ExternalServiceError as error:
                    SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

            EmailService.send_reservation_confirmed_email(reservation=instance)
            EmailService.send_staff_notification_reservation_made_email(reservation=instance)

        elif instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_reservation_requires_handling_email(reservation=instance)
            EmailService.send_staff_notification_reservation_requires_handling_email(reservation=instance)

        return instance
