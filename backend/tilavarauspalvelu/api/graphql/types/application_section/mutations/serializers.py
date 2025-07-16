from __future__ import annotations

from typing import Any, TypedDict

from django.db import models
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import AllocatedTimeSlot, ApplicationSection, Reservation
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime
from utils.db import NowTT


class RejectAllSectionOptionsSerializer(NestingModelSerializer):
    instance: ApplicationSection

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        slots_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section=self.instance,
        ).exists()

        if slots_exist:
            msg = "Application section has allocated time slots and cannot be rejected."
            raise ValidationError(msg, code=error_codes.CANNOT_REJECT_SECTION_OPTIONS)

        return data

    def save(self, **kwargs: Any) -> ApplicationSection:
        self.instance.reservation_unit_options.all().update(is_rejected=True)
        return self.instance


class RestoreAllSectionOptionsSerializer(NestingModelSerializer):
    instance: ApplicationSection

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
        ]

    def save(self, **kwargs: Any) -> ApplicationSection:
        self.instance.reservation_unit_options.all().update(is_rejected=False)
        return self.instance


class CancellationOutput(TypedDict):
    expected_cancellations: int
    actual_cancellations: int


class ApplicationSectionReservationCancellationInputSerializer:
    instance: ApplicationSection

    def save(self, **kwargs: Any) -> CancellationOutput:
        future_reservations = Reservation.objects.all().for_application_section(self.instance).filter(
            user=self.instance.application.user,
            begins_at__gt=local_datetime(),
        )

        cancellable_reservations = (
            future_reservations.filter(
                type=ReservationTypeChoice.SEASONAL,
                state=ReservationStateChoice.CONFIRMED,
                price=0,
                reservation_unit__cancellation_rule__isnull=False,
            )
            .alias(
                cancellation_time=models.F("reservation_unit__cancellation_rule__can_be_cancelled_time_before"),
                cancellation_cutoff=NowTT() + models.F("cancellation_time"),
            )
            .filter(
                begins_at__gt=models.F("cancellation_cutoff"),
            )
            .distinct()
        )

        has_access_code = cancellable_reservations.requires_active_access_code().exists()

        cancellable_reservations_count = cancellable_reservations.count()
        future_reservations_count = future_reservations.count()

        data = CancellationOutput(
            expected_cancellations=future_reservations_count,
            actual_cancellations=cancellable_reservations_count,
        )

        cancellable_reservations.update(
            state=ReservationStateChoice.CANCELLED,
            cancel_reason=self.validated_data["cancel_reason"],
            cancel_details=self.validated_data.get("cancel_details", ""),
        )

        if cancellable_reservations_count:
            EmailService.send_seasonal_booking_cancelled_all_email(application_section=self.instance)
            EmailService.send_seasonal_booking_cancelled_all_staff_notification_email(application_section=self.instance)

            if has_access_code:
                # Reschedule the seasonal booking to remove all cancelled reservations.
                # This might leave behind empty series', which is fine.
                PindoraService.reschedule_access_code(self.instance)

        return data


class ApplicationSectionReservationCancellationOutputSerializer(NestingModelSerializer):
    future = serializers.IntegerField(required=True)
    cancelled = serializers.IntegerField(required=True)

    class Meta:
        model = ApplicationSection
        fields = [
            "future",
            "cancelled",
        ]
        extra_kwargs = {
            "future": {"required": True},
            "cancelled": {"required": True},
        }
