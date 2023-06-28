import datetime

from django.utils.timezone import get_default_timezone

from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.reservations.reservation_serializers.mixins import (
    ReservationSchedulingMixin,
)
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.email_utils import send_reservation_modified_email
from reservations.models import STATE_CHOICES as ReservationState
from reservations.models import Reservation, ReservationType

DEFAULT_TIMEZONE = get_default_timezone()


class StaffReservationAdjustTimeSerializer(
    PrimaryKeyUpdateSerializer, ReservationSchedulingMixin
):
    class Meta:
        model = Reservation
        fields = [
            "pk",
            "begin",
            "end",
            "state",
            "buffer_time_before",
            "buffer_time_after",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].readonly = True
        self.fields["buffer_time_before"].help_text = (
            "Can be a number of seconds or timespan in format HH:MM:SS. "
            "Null/undefined value means buffer from reservation unit is used."
        )
        self.fields["buffer_time_after"].help_text = (
            "Can be a number of seconds or timespan in format HH:MM:SS. "
            "Null/undefined value means buffer from reservation unit is used."
        )

    def save(self, **kwargs):
        instance = super().save(**kwargs)

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        if instance.type == ReservationType.NORMAL and instance.end > now:
            send_reservation_modified_email(instance)

        return instance

    def validate(self, data):
        data = super().validate(data)

        if self.instance.state != ReservationState.CONFIRMED:
            raise ValidationErrorWithCode(
                "Reservation must be in confirmed state.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        begin = data["begin"]
        end = data["end"]

        new_buffer_before = data.get("buffer_time_before", None)
        new_buffer_after = data.get("buffer_time_after", None)

        for reservation_unit in self.instance.reservation_unit.all():
            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_buffer_times(
                reservation_unit,
                begin,
                end,
                buffer_before=new_buffer_before,
                buffer_after=new_buffer_after,
            )
            self.check_reservation_intervals_for_staff_reservation(
                reservation_unit, begin
            )

        self.check_begin(begin, end)

        return data

    def check_begin(self, new_begin, new_end):
        if new_begin > new_end:
            raise ValidationErrorWithCode(
                "End cannot be before begin",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        if now.hour <= 1:
            now = now - datetime.timedelta(days=1)

        if self.instance.end.date() < now.date():
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed anymore.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        if new_begin.date() < now.date():
            raise ValidationErrorWithCode(
                "Reservation new begin cannot be in the past.",
                ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST,
            )
