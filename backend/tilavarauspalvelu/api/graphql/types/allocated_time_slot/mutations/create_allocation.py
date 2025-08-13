import datetime

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import Weekday
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    ApplicationSection,
    ReservationUnitOption,
    SuitableTimeRange,
    User,
)
from tilavarauspalvelu.typing import AllocatedTimeSlotCreateData, error_codes
from utils.date_utils import time_difference, timedelta_to_json

__all__ = [
    "AllocatedTimeSlotCreateMutation",
]


class AllocatedTimeSlotCreateMutation(MutationType[AllocatedTimeSlot], kind="create"):
    """Create an allocated time slot for a reservation unit option."""

    reservation_unit_option = Input(required=True)

    day_of_the_week = Input()
    begin_time = Input()
    end_time = Input()

    force = Input(bool, default_value=False)

    @classmethod
    def __permissions__(
        cls,
        instance: AllocatedTimeSlot,
        info: GQLInfo[User],
        input_data: AllocatedTimeSlotCreateData,
    ) -> None:
        option_pk = input_data["reservation_unit_option"]

        option = ReservationUnitOption.objects.select_related("reservation_unit__unit").filter(pk=option_pk).first()
        if option is None:
            msg = f"Reservation Unit Option with pk {option_pk} does not exist."
            raise GraphQLPermissionError(msg)

        user = info.context.user
        unit = option.reservation_unit.unit

        if user.permissions.can_manage_applications_for_units([unit]):
            return

        msg = "No permission to create."
        raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(
        cls,
        instance: AllocatedTimeSlot,
        info: GQLInfo[User],
        input_data: AllocatedTimeSlotCreateData,
    ) -> None:
        force = input_data["force"]

        option = (
            ReservationUnitOption.objects.select_related("application_section")
            .filter(pk=input_data["reservation_unit_option"])
            .first()
        )

        section = option.application_section

        cls.validate_statuses(section=section)
        cls.validate_slots_per_week(section=section)
        cls.validate_reservation_unit_option_available(option=option)
        cls.validate_no_allocations_on_the_same_day(
            section=section,
            day_of_the_week=input_data["day_of_the_week"],
        )
        cls.validate_overlapping_allocations(
            section=section,
            day_of_the_week=input_data["day_of_the_week"],
            begin_time=input_data["begin_time"],
            end_time=input_data["end_time"],
            option=option,
        )

        if not force:
            cls.validate_duration(
                section=section,
                begin_time=input_data["begin_time"],
                end_time=input_data["end_time"],
            )
            cls.validate_day_of_the_week_is_suitable(
                section=section,
                day_of_the_week=input_data["day_of_the_week"],
            )
            cls.validate_within_suitable_time_range(
                section=section,
                day_of_the_week=input_data["day_of_the_week"],
                begin_time=input_data["begin_time"],
                end_time=input_data["end_time"],
            )

    @staticmethod
    def validate_statuses(section: ApplicationSection) -> None:
        section_status = section.status
        application_status = section.application.status

        if not section_status.can_allocate:
            msg = f"Cannot allocate to application section in status: '{section_status.value}'"
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_SECTION_STATUS_NOT_ALLOWED)

        if not application_status.can_allocate:
            msg = f"Cannot allocate to application in status: '{application_status.value}'"
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_APPLICATION_STATUS_NOT_ALLOWED)

    @staticmethod
    def validate_reservation_unit_option_available(option: ReservationUnitOption) -> None:
        if option.is_rejected:
            msg = "This reservation unit option has been rejected."
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_OPTION_REJECTED)

        if option.is_locked:
            msg = "This reservation unit option has been locked."
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_OPTION_LOCKED)

    @staticmethod
    def validate_overlapping_allocations(
        section: ApplicationSection,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
        option: ReservationUnitOption,
    ) -> None:
        has_overlapping_allocations = AllocatedTimeSlot.objects.all().has_overlapping_allocations(
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
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_OVERLAPPING_ALLOCATIONS)

    @staticmethod
    def validate_no_allocations_on_the_same_day(section: ApplicationSection, day_of_the_week: Weekday) -> None:
        allocation_for_day_already_exist = AllocatedTimeSlot.objects.filter(
            reservation_unit_option__application_section=section,
            day_of_the_week=day_of_the_week,
        ).exists()

        if allocation_for_day_already_exist:
            msg = "Cannot make multiple allocations on the same day of the week for one application section."
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_NO_ALLOCATIONS_ON_THE_SAME_DAY)

    @staticmethod
    def validate_slots_per_week(section: ApplicationSection) -> None:
        allocations = AllocatedTimeSlot.objects.filter(reservation_unit_option__application_section=section).count()

        if allocations >= section.applied_reservations_per_week:
            msg = (
                f"Cannot make more allocations for this application section. "
                f"Maximum allowed is {section.applied_reservations_per_week}."
            )
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_APPLIED_RESERVATIONS_PER_WEEK_EXCEEDED)

    @staticmethod
    def validate_duration(
        section: ApplicationSection,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> None:
        duration = time_difference(begin_time, end_time)

        if duration < section.reservation_min_duration:
            min_allowed = timedelta_to_json(section.reservation_min_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too short. "
                f"Minimum allowed is {min_allowed} "
                f"while given duration is {given_duration}."
            )
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_DURATION_TOO_SHORT)

        if duration > section.reservation_max_duration:
            max_allowed = timedelta_to_json(section.reservation_max_duration)
            given_duration = timedelta_to_json(duration)
            msg = (
                f"Allocation duration too long. "
                f"Maximum allowed is {max_allowed} "
                f"while given duration is {given_duration}."
            )
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_DURATION_TOO_LONG)

        if duration.total_seconds() % 1800 != 0:
            msg = "Allocation duration must be a multiple of 30 minutes."
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_DURATION_NOT_A_MULTIPLE_OF_30_MINUTES)

    @staticmethod
    def validate_day_of_the_week_is_suitable(section: ApplicationSection, day_of_the_week: Weekday) -> None:
        if day_of_the_week not in section.suitable_days_of_the_week:
            msg = (
                "Cannot allocate for this day of the week. "
                "Applicant has not indicated it suitable for this application section."
            )
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_DAY_OF_THE_WEEK_NOT_SUITABLE)

    @staticmethod
    def validate_within_suitable_time_range(
        section: ApplicationSection,
        day_of_the_week: Weekday,
        begin_time: datetime.time,
        end_time: datetime.time,
    ) -> None:
        fits_in_time_range = SuitableTimeRange.objects.all().fits_in_time_range(
            application_section=section,
            day_of_the_week=day_of_the_week,
            begin_time=begin_time,
            end_time=end_time,
        )

        if not fits_in_time_range:
            msg = "Given time slot does not fit within applicants suitable time ranges."
            raise GraphQLValidationError(msg, code=error_codes.ALLOCATION_NOT_IN_SUITABLE_TIME_RANGES)
