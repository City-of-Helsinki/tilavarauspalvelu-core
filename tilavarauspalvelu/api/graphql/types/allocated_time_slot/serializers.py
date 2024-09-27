import datetime
from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import AllocatedTimeSlot, ApplicationSection, ReservationUnitOption, SuitableTimeRange
from utils.date_utils import time_difference, timedelta_to_json

__all__ = [
    "AllocatedTimeSlotCreateSerializer",
]


class AllocatedTimeSlotCreateSerializer(NestingModelSerializer):
    force = serializers.BooleanField(default=False, required=False, write_only=True)

    class Meta:
        model = AllocatedTimeSlot
        fields = [
            "pk",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "reservation_unit_option",
            "force",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        force: bool = data.pop("force", False)

        section: ApplicationSection = data["reservation_unit_option"].application_section

        self.validate_statuses(section=section)
        self.validate_slots_per_week(section=section)
        self.validate_reservation_unit_option_available(
            option=data["reservation_unit_option"],
        )
        self.validate_no_allocations_on_the_same_day(
            section=section,
            day_of_the_week=data["day_of_the_week"],
        )
        self.validate_overlapping_allocations(
            section=section,
            day_of_the_week=data["day_of_the_week"],
            begin_time=data["begin_time"],
            end_time=data["end_time"],
            option=data["reservation_unit_option"],
        )

        if not force:
            self.validate_duration(
                section=section,
                begin_time=data["begin_time"],
                end_time=data["end_time"],
            )
            self.validate_day_of_the_week_is_suitable(
                section=section,
                day_of_the_week=data["day_of_the_week"],
            )
            self.validate_within_suitable_time_range(
                section=section,
                day_of_the_week=data["day_of_the_week"],
                begin_time=data["begin_time"],
                end_time=data["end_time"],
            )

        return data

    @staticmethod
    def validate_statuses(section: ApplicationSection) -> None:
        section_status = section.status
        application_status = section.application.status

        if not section_status.can_allocate:
            msg = f"Cannot allocate to application section in status: '{section_status.value}'"
            raise ValidationError(msg, code=error_codes.ALLOCATION_SECTION_STATUS_NOT_ALLOWED)

        if not application_status.can_allocate:
            msg = f"Cannot allocate to application in status: '{application_status.value}'"
            raise ValidationError(msg, code=error_codes.ALLOCATION_APPLICATION_STATUS_NOT_ALLOWED)

    @staticmethod
    def validate_reservation_unit_option_available(option: ReservationUnitOption) -> None:
        if option.rejected:
            msg = "This reservation unit option has been rejected."
            raise ValidationError(msg, code=error_codes.ALLOCATION_OPTION_REJECTED)

        if option.locked:
            msg = "This reservation unit option has been locked."
            raise ValidationError(msg, code=error_codes.ALLOCATION_OPTION_LOCKED)

    @staticmethod
    def validate_overlapping_allocations(
        section: ApplicationSection,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
        option: ReservationUnitOption,
    ) -> None:
        has_overlapping_allocations = AllocatedTimeSlot.objects.has_overlapping_allocations(
            reservation_unit_option=option,
            begin_date=section.reservations_begin_date,
            end_date=section.reservations_end_date,
            day_of_the_week=day_of_the_week,
            begin_time=begin_time,
            end_time=end_time,
        )

        if has_overlapping_allocations:
            msg = (
                "Given time slot has already been allocated for another application section "
                "with a related reservation unit or resource."
            )
            raise ValidationError(msg, code=error_codes.ALLOCATION_OVERLAPPING_ALLOCATIONS)

    @staticmethod
    def validate_no_allocations_on_the_same_day(section: ApplicationSection, day_of_the_week: Weekday) -> None:
        allocation_for_day_already_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section=section,
            day_of_the_week=day_of_the_week,
        ).exists()

        if allocation_for_day_already_exist:
            msg = "Cannot make multiple allocations on the same day of the week for one application section."
            raise ValidationError(msg, code=error_codes.ALLOCATION_NO_ALLOCATIONS_ON_THE_SAME_DAY)

    @staticmethod
    def validate_slots_per_week(section: ApplicationSection) -> None:
        allocations = AllocatedTimeSlot.objects.filter(reservation_unit_option__application_section=section).count()

        if allocations >= section.applied_reservations_per_week:
            msg = (
                f"Cannot make more allocations for this application section. "
                f"Maximum allowed is {section.applied_reservations_per_week}."
            )
            raise ValidationError(msg, code=error_codes.ALLOCATION_APPLIED_RESERVATIONS_PER_WEEK_EXCEEDED)

    @staticmethod
    def validate_duration(
        section: ApplicationSection,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> None:
        duration = time_difference(end_time, begin_time)

        if duration < section.reservation_min_duration:
            min_allowed = timedelta_to_json(section.reservation_min_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too short. "
                f"Minimum allowed is {min_allowed} "
                f"while given duration is {given_duration}."
            )
            raise ValidationError(msg, code=error_codes.ALLOCATION_DURATION_TOO_SHORT)

        if duration > section.reservation_max_duration:
            max_allowed = timedelta_to_json(section.reservation_max_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too long. "
                f"Maximum allowed is {max_allowed} "
                f"while given duration is {given_duration}."
            )
            raise ValidationError(msg, code=error_codes.ALLOCATION_DURATION_TOO_LONG)

        if duration.total_seconds() % 1800 != 0:
            msg = "Allocation duration must be a multiple of 30 minutes."
            raise ValidationError(msg, code=error_codes.ALLOCATION_DURATION_NOT_A_MULTIPLE_OF_30_MINUTES)

    @staticmethod
    def validate_day_of_the_week_is_suitable(section: ApplicationSection, day_of_the_week: Weekday) -> None:
        if day_of_the_week not in section.suitable_days_of_the_week:
            msg = (
                "Cannot allocate for this day of the week. "
                "Applicant has not indicated it suitable for this application section."
            )
            raise ValidationError(msg, code=error_codes.ALLOCATION_DAY_OF_THE_WEEK_NOT_SUITABLE)

    @staticmethod
    def validate_within_suitable_time_range(
        section: ApplicationSection,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> None:
        fits_in_time_range = SuitableTimeRange.objects.fits_in_time_range(
            application_section=section,
            day_of_the_week=day_of_the_week,
            begin_time=begin_time,
            end_time=end_time,
        )

        if not fits_in_time_range:
            msg = "Given time slot does not fit within applicants suitable time ranges."
            raise ValidationError(msg, code=error_codes.ALLOCATION_NOT_IN_SUITABLE_TIME_RANGES)
