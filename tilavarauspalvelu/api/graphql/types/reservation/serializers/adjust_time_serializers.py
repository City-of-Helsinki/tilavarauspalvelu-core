from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.fields import EnumFriendlyChoiceField

from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import (
    ReservationPriceMixin,
    ReservationSchedulingMixin,
)
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ReservationUnit


class ReservationAdjustTimeSerializer(OldPrimaryKeyUpdateSerializer, ReservationPriceMixin, ReservationSchedulingMixin):
    instance: Reservation

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "begin",
            "end",
            "state",
        ]

    def save(self) -> Reservation:
        kwargs: dict[str, Any] = {}
        for res_unit in self.instance.reservation_units.all():
            kwargs["buffer_time_before"] = res_unit.actions.get_actual_before_buffer(self.validated_data["begin"])
            kwargs["buffer_time_after"] = res_unit.actions.get_actual_after_buffer(self.validated_data["end"])
            break

        instance = super().save(**kwargs)
        EmailService.send_reservation_modified_email(reservation=instance)
        if instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_staff_notification_reservation_requires_handling_email(reservation=instance)
        return instance

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        data = super().validate(data)

        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            msg = "Only reservations in 'CONFIRMED' state can be rescheduled."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        if self.instance.type not in ReservationTypeChoice.allowed_for_user_time_adjust:
            msg = "Only reservations of type 'NORMAL' or 'BEHALF' can be rescheduled."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        if self.instance.handled_at:
            msg = "Reservation has gone through handling and cannot be changed anymore."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        begin: datetime.datetime = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end: datetime.datetime = data["end"].astimezone(DEFAULT_TIMEZONE)
        self.check_begin(begin, end)

        for reservation_unit in self.instance.reservation_units.all():
            self.check_cancellation_rules(reservation_unit)
            self.check_reservation_time(reservation_unit)
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_reservation_duration(reservation_unit, begin, end)
            self.check_buffer_times(reservation_unit, begin, end)
            self.check_reservation_days_before(begin, reservation_unit)
            self.check_opening_hours(reservation_unit, begin, end)
            self.check_open_application_round(reservation_unit, begin, end)
            self.check_reservation_start_time(reservation_unit, begin)

        self.check_and_handle_pricing(data)

        if self.instance.requires_handling:
            data["state"] = ReservationStateChoice.REQUIRES_HANDLING.value

        return data

    def check_begin(self, begin: datetime.datetime, end: datetime.datetime) -> None:
        if begin > end:
            msg = "End cannot be before begin"
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        now = local_datetime()

        if begin < now:
            msg = "Reservation new begin cannot be in the past"
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST)

        if self.instance.begin < now:
            msg = "Reservation time cannot be changed when current begin time is in past."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_CURRENT_BEGIN_IN_PAST)

    def check_cancellation_rules(self, reservation_unit: ReservationUnit) -> None:
        now = local_datetime()

        cancel_rule = reservation_unit.cancellation_rule
        if not cancel_rule:
            msg = "Reservation time cannot be changed thus no cancellation rule."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.CANCELLATION_NOT_ALLOWED)
        must_be_cancelled_before = self.instance.begin - cancel_rule.can_be_cancelled_time_before
        if must_be_cancelled_before < now:
            msg = "Reservation time cannot be changed because the cancellation period has expired."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.CANCELLATION_TIME_PAST)

    def check_and_handle_pricing(self, data: dict[str, Any]) -> None:
        if self.instance.price > 0:
            msg = "Reservation time cannot be changed due to its price"
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.CANCELLATION_NOT_ALLOWED)
        if self.requires_price_calculation(data):
            pricing = self.calculate_price(data["begin"], data["end"], self.instance.reservation_units.all())

            if pricing.reservation_price > 0:
                msg = "Reservation begin time change causes price change that not allowed."
                raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)
