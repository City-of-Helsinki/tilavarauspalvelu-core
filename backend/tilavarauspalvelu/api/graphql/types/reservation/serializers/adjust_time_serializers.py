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
from tilavarauspalvelu.typing import ReservationAdjustTimeData
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit


class ReservationAdjustTimeSerializer(NestingModelSerializer):
    """Adjust the time of a reservation."""

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
            "state",
        ]
        extra_kwargs = {
            "begin": {"required": True},
            "end": {"required": True},
        }

    def validate(self, data: ReservationAdjustTimeData) -> ReservationAdjustTimeData:
        self.instance.user.validators.validate_is_internal_user_if_ad_user()

        self.instance.validators.validate_reservation_state_allows_rescheduling()
        self.instance.validators.validate_reservation_type_allows_rescheduling()
        self.instance.validators.validate_reservation_not_handled()
        self.instance.validators.validate_reservation_not_paid()
        self.instance.validators.validate_reservation_not_past_or_ongoing()
        self.instance.validators.validate_single_reservation_unit()

        begin = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end = data["end"].astimezone(DEFAULT_TIMEZONE)

        current_begin = self.instance.begin.astimezone(DEFAULT_TIMEZONE)

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        reservation_unit.validators.validate_reservation_unit_is_direct_bookable()
        reservation_unit.validators.validate_reservation_unit_is_published()
        reservation_unit.validators.validate_reservation_unit_is_reservable_at(begin=begin)
        reservation_unit.validators.validate_begin_before_end(begin=begin, end=end)
        reservation_unit.validators.validate_duration_is_allowed(duration=end - begin)
        reservation_unit.validators.validate_reservation_days_before(begin=begin)
        reservation_unit.validators.validate_reservation_unit_is_open(begin=begin, end=end)
        reservation_unit.validators.validate_not_rescheduled_to_paid_date(begin=begin)
        reservation_unit.validators.validate_cancellation_rule(begin=current_begin)
        reservation_unit.validators.validate_not_in_open_application_round(begin=begin.date(), end=end.date())
        reservation_unit.validators.validate_reservation_begin_time(begin=begin)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begin=begin, end=end, ignore_ids=[self.instance.pk]
        )

        if self.instance.requires_handling:
            data["state"] = ReservationStateChoice.REQUIRES_HANDLING

        data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
        data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)
        data["access_type"] = reservation_unit.actions.get_access_type_at(begin, default=AccessType.UNRESTRICTED)

        return data

    def update(self, instance: Reservation, validated_data: ReservationAdjustTimeData) -> Reservation:
        previous_data = ReservationAdjustTimeData(
            begin=instance.begin,
            end=instance.end,
            state=ReservationStateChoice(instance.state),
            buffer_time_before=instance.buffer_time_before,
            buffer_time_after=instance.buffer_time_after,
            access_type=AccessType(instance.access_type),
        )

        had_access_code = instance.access_type == AccessType.ACCESS_CODE
        instance: Reservation = super().update(instance=instance, validated_data=validated_data)
        has_access_code = instance.access_type == AccessType.ACCESS_CODE

        # After rescheduling the reservation, check for overlapping reservations again.
        # This can fail if another reservation is created of moved to the same time
        # in a reservation unit in the same space-resource hierarchy at almost the same time.
        if instance.actions.overlapping_reservations().exists():
            # Rollback the changes
            super().update(instance=instance, validated_data=previous_data)
            msg = "Overlapping reservations were created at the same time."
            raise ValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        if had_access_code or has_access_code:
            try:
                PindoraService.sync_access_code(obj=instance)
            except ExternalServiceError as error:
                # Rollback the changes
                super().update(instance=instance, validated_data=previous_data)
                raise ValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        EmailService.send_reservation_rescheduled_email(reservation=instance)

        if instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_reservation_requires_handling_staff_notification_email(reservation=instance)

        return instance
