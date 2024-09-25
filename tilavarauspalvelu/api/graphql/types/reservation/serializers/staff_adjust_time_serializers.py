import datetime
from typing import TYPE_CHECKING

from django.utils.timezone import get_default_timezone
from graphene_django_extensions.fields import EnumFriendlyChoiceField

from common.date_utils import local_datetime
from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationSchedulingMixin
from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.utils.email.reservation_email_notification_sender import ReservationEmailNotificationSender

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit

DEFAULT_TIMEZONE = get_default_timezone()


class StaffReservationAdjustTimeSerializer(OldPrimaryKeyUpdateSerializer, ReservationSchedulingMixin):
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
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "buffer_time_before": {
                "help_text": (
                    "Can be a number of seconds or timespan in format HH:MM:SS. "
                    "Null/undefined value means buffer from reservation unit is used."
                )
            },
            "buffer_time_after": {
                "help_text": (
                    "Can be a number of seconds or timespan in format HH:MM:SS. "
                    "Null/undefined value means buffer from reservation unit is used."
                )
            },
        }

    def save(self, **kwargs):
        instance = super().save(**kwargs)

        now = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        if instance.type == ReservationTypeChoice.NORMAL and instance.end > now:
            ReservationEmailNotificationSender.send_reservation_modified_email(reservation=instance)

        return instance

    def validate(self, data):
        data = super().validate(data)

        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            raise ValidationErrorWithCode(
                "Reservation must be in confirmed state.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        begin = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end = data["end"].astimezone(DEFAULT_TIMEZONE)

        new_buffer_before = data.get("buffer_time_before", None)
        new_buffer_after = data.get("buffer_time_after", None)

        reservation_unit: ReservationUnit
        for reservation_unit in self.instance.reservation_unit.all():
            if reservation_unit.reservation_block_whole_day:
                data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
                data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)

            self.check_reservation_overlap(reservation_unit, begin, end)
            self.check_buffer_times(
                reservation_unit,
                begin,
                end,
                new_buffer_before=new_buffer_before,
                new_buffer_after=new_buffer_after,
            )
            self.check_reservation_intervals_for_staff_reservation(reservation_unit, begin)

        self.check_begin(begin, end)

        return data

    def check_begin(self, new_begin: datetime.datetime, new_end: datetime.datetime) -> None:
        if new_begin > new_end:
            raise ValidationErrorWithCode(
                "End cannot be before begin",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        now = local_datetime()
        min_allowed_date = now.date()

        # For the first hour of the day, we allow reservations to be moved to the previous day
        if now.hour == 0:
            min_allowed_date -= datetime.timedelta(days=1)

        if self.instance.end.astimezone(DEFAULT_TIMEZONE).date() < min_allowed_date:
            raise ValidationErrorWithCode(
                "Reservation time cannot be changed anymore.",
                ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED,
            )

        if new_begin.astimezone(DEFAULT_TIMEZONE).date() < min_allowed_date:
            raise ValidationErrorWithCode(
                "Reservation new begin date cannot be in the past.",
                ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST,
            )
