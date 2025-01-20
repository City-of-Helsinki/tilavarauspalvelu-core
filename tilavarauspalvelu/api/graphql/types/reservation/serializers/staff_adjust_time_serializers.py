from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation
from utils.date_utils import DEFAULT_TIMEZONE

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit


class StaffReservationAdjustTimeSerializer(NestingModelSerializer):
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
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "state",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end = data["end"].astimezone(DEFAULT_TIMEZONE)

        self.instance.validator.validate_reservation_state_allows_rescheduling()
        self.instance.validator.validate_single_reservation_unit()
        self.instance.validator.validate_reservation_can_be_modified_by_staff()

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        if reservation_unit.reservation_block_whole_day:
            data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
            data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)

        reservation_unit.validator.validate_begin_before_end(begin=begin, end=end)
        reservation_unit.validator.validate_reservation_begin_time_staff(begin=begin)
        reservation_unit.validator.validate_no_overlapping_reservations(
            begin=begin,
            end=end,
            new_buffer_time_before=data.get("buffer_time_before"),
            new_buffer_time_after=data.get("buffer_time_after"),
            ignore_ids=[self.instance.pk],
        )

        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)

        EmailService.send_reservation_modified_email(reservation=instance)
        EmailService.send_staff_notification_reservation_requires_handling_email(reservation=instance)

        return instance
