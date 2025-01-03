from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from graphene_django_extensions.fields import EnumFriendlyChoiceField

from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from tilavarauspalvelu.api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationSchedulingMixin
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit


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

    def save(self, **kwargs: Any) -> Reservation:
        instance = super().save(**kwargs)

        EmailService.send_reservation_modified_email(reservation=instance)
        EmailService.send_staff_notification_reservation_requires_handling_email(reservation=instance)

        return instance

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        data = super().validate(data)

        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            msg = "Reservation must be in confirmed state."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        begin = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end = data["end"].astimezone(DEFAULT_TIMEZONE)

        new_buffer_before = data.get("buffer_time_before", None)
        new_buffer_after = data.get("buffer_time_after", None)

        reservation_unit: ReservationUnit
        for reservation_unit in self.instance.reservation_units.all():
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
            msg = "End cannot be before begin"
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        now = local_datetime()
        min_allowed_date = now.date()

        # For the first hour of the day, we allow reservations to be moved to the previous day
        if now.hour == 0:
            min_allowed_date -= datetime.timedelta(days=1)

        if self.instance.end.astimezone(DEFAULT_TIMEZONE).date() < min_allowed_date:
            msg = "Reservation time cannot be changed anymore."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_MODIFICATION_NOT_ALLOWED)

        if new_begin.astimezone(DEFAULT_TIMEZONE).date() < min_allowed_date:
            msg = "Reservation new begin date cannot be in the past."
            raise ValidationErrorWithCode(msg, ValidationErrorCodes.RESERVATION_BEGIN_IN_PAST)
