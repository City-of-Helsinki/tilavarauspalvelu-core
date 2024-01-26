import datetime
from collections import defaultdict
from typing import Any

from rest_framework import serializers
from rest_framework.settings import api_settings

from applications.models import ApplicationEventSchedule
from common.date_utils import time_difference, timedelta_to_json
from common.serializers import TranslatedModelSerializer
from reservation_units.models import ReservationUnit


class ApplicationEventScheduleApproveSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    force = serializers.BooleanField(default=False, required=False, write_only=True)

    class Meta:
        model = ApplicationEventSchedule
        fields = [
            "pk",
            "allocated_day",
            "allocated_begin",
            "allocated_end",
            "allocated_reservation_unit",
            "force",
        ]
        # All fields should be set when approving a schedule
        extra_kwargs = {
            "allocated_day": {"required": True},
            "allocated_begin": {"required": True},
            "allocated_end": {"required": True},
            "allocated_reservation_unit": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)
        force: bool = data.pop("force", False)

        self.validate_statuses(errors)
        self.validate_reservation_unit(data["allocated_reservation_unit"], errors)
        self.validate_not_already_allocated(
            data["allocated_day"],
            data["allocated_begin"],
            data["allocated_end"],
            data["allocated_reservation_unit"],
            errors,
        )
        self.validate_no_events_on_the_same_day(data["allocated_day"], errors)

        if not force:
            self.validate_duration(data["allocated_begin"], data["allocated_end"], errors)
            self.validate_with_events_accepted_schedules(data["allocated_day"], errors)
            self.validate_within_wished_period(
                data["allocated_day"],
                data["allocated_begin"],
                data["allocated_end"],
                errors,
            )

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def validate_statuses(self, errors: dict[str, list[str]]) -> None:
        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_approve:
            msg = f"Schedule cannot be approved for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_approve:
            msg = f"Schedule cannot be approved for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_reservation_unit(self, reservation_unit: ReservationUnit, errors: dict[str, list[str]]) -> None:
        includes_reservation_unit = self.instance.application_event.event_reservation_units.filter(
            reservation_unit=reservation_unit,
        ).exists()

        if not includes_reservation_unit:
            msg = "Cannot allocate schedule for this reservation unit. Reservation unit is not included in the event."
            errors["allocated_reservation_unit"].append(msg)

    def validate_not_already_allocated(
        self,
        day: int,
        begin: datetime.time,
        end: datetime.time,
        reservation_unit: ReservationUnit,
        errors: dict[str, list[str]],
    ) -> None:
        min_day = self.instance.application_event.begin
        max_day = self.instance.application_event.end
        if min_day is None or max_day is None:
            msg = "Cannot allocate schedule for this day and time period. Event begin and end dates must be set."
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)
            return

        has_overlapping_allocations = (
            ApplicationEventSchedule.objects.exclude(pk=self.instance.pk)
            .filter(
                # Only fetch events that overlap with this event,
                # see `opening_hours.utils.time_span_element.TimeSpanElement.overlaps_with`
                application_event__begin__lt=max_day,
                application_event__end__gt=min_day,
                # TODO: [TILA-2904] can't be overlapping with common resource or space hierarchy.
                allocated_reservation_unit=reservation_unit,
            )
            .has_overlapping_allocations(day=day, begin=begin, end=end)
        )

        if has_overlapping_allocations:
            msg = (
                "Cannot allocate schedule for this day and time period. "
                "Given time period has already been allocated for another event "
                "with the same reservation unit."
            )
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_no_events_on_the_same_day(self, day: int, errors: dict[str, list[str]]) -> None:
        events_schedules = self.instance.application_event.application_event_schedules.all()
        other_schedules = events_schedules.exclude(pk=self.instance.pk)

        accepted_same_day: int = other_schedules.filter(allocated_day=day).accepted().count()

        if accepted_same_day != 0:
            msg = "Cannot allocate multiple schedules on the same day for one event."
            errors["allocated_day"].append(msg)

    def validate_duration(self, begin: datetime.time, end: datetime.time, errors: dict[str, list[str]]) -> None:
        duration = time_difference(end, begin)

        if duration < self.instance.application_event.min_duration:
            min_allowed = timedelta_to_json(self.instance.application_event.min_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too short. "
                f"Minimum allowed is {min_allowed} "
                f"while given duration is {given_duration}."
            )
            errors["allocated_end"].append(msg)

        if duration > self.instance.application_event.max_duration:
            max_allowed = timedelta_to_json(self.instance.application_event.max_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too long. "
                f"Maximum allowed is {max_allowed} "
                f"while given duration is {given_duration}."
            )
            errors["allocated_end"].append(msg)

        if duration.total_seconds() % 900 != 0:
            msg = "Allocation duration must be a multiple of 15 minutes."
            errors["allocated_end"].append(msg)

    def validate_with_events_accepted_schedules(self, day: int, errors: dict[str, list[str]]) -> None:
        events_schedules = self.instance.application_event.application_event_schedules.all()
        other_schedules = events_schedules.exclude(pk=self.instance.pk)

        accepted: int = other_schedules.accepted().count()

        if accepted >= (self.instance.application_event.events_per_week or 0):
            msg = (
                f"Cannot allocate more schedules for this event. "
                f"Maximum allowed is {self.instance.application_event.events_per_week or 0}."
            )
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

    def validate_within_wished_period(
        self,
        day: int,
        begin: datetime.time,
        end: datetime.time,
        errors: dict[str, list[str]],
    ) -> None:
        events_schedules = self.instance.application_event.application_event_schedules.all()

        can_allocate: bool = events_schedules.allocation_fits_in_wished_periods(day=day, begin=begin, end=end)
        if not can_allocate:
            msg = (
                "Cannot allocate schedule for this day and time period. "
                "Given time period does not fit within applicants wished periods."
            )
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)


class ApplicationEventScheduleDeclineSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_decline:
            msg = f"Schedule cannot be declined for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_decline:
            msg = f"Schedule cannot be declined for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance: ApplicationEventSchedule, validated_data: dict[str, Any]):
        instance.declined = True
        return super().update(instance, validated_data)


class ApplicationEventScheduleResetSerializer(TranslatedModelSerializer):
    instance: ApplicationEventSchedule

    class Meta:
        model = ApplicationEventSchedule
        fields = ["pk"]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        errors: dict[str, list[str]] = defaultdict(list)

        event_status = self.instance.application_event.status
        application_status = self.instance.application_event.application.status

        if not event_status.can_reset:
            msg = f"Schedule cannot be reset for event in status: '{event_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if not application_status.can_reset:
            msg = f"Schedule cannot be reset for application in status: '{application_status.value}'"
            errors[api_settings.NON_FIELD_ERRORS_KEY].append(msg)

        if errors:
            raise serializers.ValidationError(errors)

        return data

    def update(self, instance: ApplicationEventSchedule, validated_data: dict[str, Any]):
        instance.allocated_day = None
        instance.allocated_begin = None
        instance.allocated_end = None
        instance.allocated_reservation_unit = None
        instance.declined = False
        return super().update(instance, validated_data)
