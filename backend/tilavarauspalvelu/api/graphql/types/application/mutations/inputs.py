from typing import Any

from undine import GQLInfo, Input, MutationType

from tilavarauspalvelu.models import ApplicationSection, ReservationUnitOption, SuitableTimeRange, User

from .validation import validate_reservation_unit_options

__all__ = [
    "ApplicationSectionInput",
    "ReservationUnitOptionInput",
    "SuitableTimeRangeInput",
]


class ReservationUnitOptionInput(MutationType[ReservationUnitOption], kind="related", related_action="delete"):
    pk = Input()
    preferred_order = Input()
    reservation_unit = Input()


class SuitableTimeRangeInput(MutationType[SuitableTimeRange], kind="related", related_action="delete"):
    pk = Input()
    priority = Input()
    day_of_the_week = Input()
    begin_time = Input()
    end_time = Input()


class ApplicationSectionInput(MutationType[ApplicationSection], kind="related", related_action="delete"):
    pk = Input()
    name = Input()
    num_persons = Input()

    reservations_begin_date = Input()
    reservations_end_date = Input()

    reservation_min_duration = Input()
    reservation_max_duration = Input()
    applied_reservations_per_week = Input()

    purpose = Input()
    age_group = Input()
    reservation_unit_options = Input(ReservationUnitOptionInput)
    suitable_time_ranges = Input(SuitableTimeRangeInput)

    @classmethod
    def __validate__(cls, instance: ApplicationSection, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        options = input_data.get("reservation_unit_options", [])
        if options:
            path = info.path.add_key("reservationUnitOptions")
            validate_reservation_unit_options(instance, options, path)
