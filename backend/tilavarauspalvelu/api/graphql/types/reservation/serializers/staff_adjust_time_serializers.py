from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.typing import StaffReservationAdjustTimeData
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

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
            "begins_at",
            "ends_at",
            "buffer_time_before",
            "buffer_time_after",
            "state",
        ]

    def validate(self, data: StaffReservationAdjustTimeData) -> StaffReservationAdjustTimeData:
        begins_at = data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        self.instance.validators.validate_reservation_state_allows_rescheduling()
        self.instance.validators.validate_single_reservation_unit()
        self.instance.validators.validate_reservation_can_be_modified_by_staff()

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        if reservation_unit.reservation_block_whole_day:
            data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begins_at)
            data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=data.get("buffer_time_before"),
            new_buffer_time_after=data.get("buffer_time_after"),
            ignore_ids=[self.instance.pk],
        )

        data["access_type"] = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        return data

    def update(self, instance: Reservation, validated_data: StaffReservationAdjustTimeData) -> Reservation:
        previous_data = StaffReservationAdjustTimeData(
            begins_at=instance.begins_at,
            ends_at=instance.ends_at,
            buffer_time_before=instance.buffer_time_before,
            buffer_time_after=instance.buffer_time_after,
            access_type=AccessType(instance.access_type),
        )

        had_access_code = instance.access_type == AccessType.ACCESS_CODE
        instance: Reservation = super().update(instance=instance, validated_data=validated_data)
        has_access_codes = instance.access_type == AccessType.ACCESS_CODE

        if instance.actions.overlapping_reservations().exists():
            # Rollback the changes
            super().update(instance=instance, validated_data=previous_data)
            msg = "Overlapping reservations were created at the same time."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        if had_access_code or has_access_codes:
            try:
                PindoraService.sync_access_code(obj=instance)
            except ExternalServiceError as error:
                # Rollback the changes
                super().update(instance=instance, validated_data=previous_data)
                raise ValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        EmailService.send_reservation_rescheduled_email(reservation=instance)
        EmailService.send_reservation_requires_handling_staff_notification_email(reservation=instance)

        return instance
