import datetime

from django.utils.timezone import get_default_timezone

from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.reservations.reservation_serializers.mixins import (
    ReservationPriceMixin,
    ReservationSchedulingMixin,
)
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.email_utils import send_reservation_modified_email
from reservations.models import STATE_CHOICES, Reservation

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationAdjustTimeSerializer(
    PrimaryKeyUpdateSerializer, ReservationPriceMixin, ReservationSchedulingMixin
):
    class Meta:
        model = Reservation
        fields = [
            "pk",
            "begin",
            "end",
            "state",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].readonly = True

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        send_reservation_modified_email(instance)
        return instance

    def validate(self, data):
        data = super().validate(data)

        if self.instance.state != STATE_CHOICES.CONFIRMED:
            raise ValidationErrorWithCode(
                "Only reservations in confirmed state can be rescheduled.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        if self.instance.handled_at:
            raise ValidationErrorWithCode(
                "Reservation has gone through handling and it cannot be changed anymore.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )
        begin = data["begin"]
        end = data["end"]
        self.check_begin(begin, end)

        for reservation_unit in self.instance.reservation_unit.all():
            self.check_cancellation_rules(reservation_unit)
            self.check_reservation_time(reservation_unit, begin, end)
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_reservation_duration(reservation_unit, begin, end)
            self.check_buffer_times(reservation_unit, begin, end)
            self.check_reservation_days_before(begin, reservation_unit)

            scheduler = ReservationUnitReservationScheduler(
                reservation_unit, opening_hours_end=end.date()
            )
            self.check_opening_hours(scheduler, begin, end)
            self.check_open_application_round(scheduler, begin, end)
            self.check_reservation_start_time(scheduler, begin)

        self.check_and_handle_pricing(data)

        if self.instance._requires_handling():
            data["state"] = STATE_CHOICES.REQUIRES_HANDLING

        return data

    def check_begin(self, begin, end):
        if begin > end:
            raise ValidationErrorWithCode(
                "End cannot be before begin",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        if begin < now:
            raise ValidationErrorWithCode(
                "Reservation new begin cannot be in the past",
                ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST,
            )

        if self.instance.begin < now:
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed when current begin time is in past.",
                ValidationErrorCodes.RESERVATION_CURRENT_BEGIN_IN_PAST,
            )

    def check_cancellation_rules(self, reservation_unit):
        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        cancel_rule = reservation_unit.cancellation_rule
        if not cancel_rule:
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed thus no cancellation rule.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )
        must_be_cancelled_before = (
            self.instance.begin - cancel_rule.can_be_cancelled_time_before
        )
        if must_be_cancelled_before < now:
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed because the cancellation period has expired.",
                ValidationErrorCodes.CANCELLATION_TIME_PAST,
            )
        if cancel_rule.needs_handling:
            raise ValidationErrorWithCode(
                "Reservation time change needs manual handling.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )

    def check_and_handle_pricing(self, data):
        if self.instance.price_net > 0:
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed due to its price",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )
        elif self.requires_price_calculation(data):
            pricing = self.calculate_price(
                data["begin"], data["end"], self.instance.reservation_unit.all()
            )

            if pricing.reservation_price_net > 0:
                raise ValidationErrorWithCode(
                    "Reservation begin time change causes price change that not allowed.",
                    ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
                )
