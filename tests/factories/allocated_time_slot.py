import datetime

import factory
from factory import fuzzy

from applications.enums import ApplicantTypeChoice, Weekday
from applications.models import AllocatedTimeSlot
from common.date_utils import DEFAULT_TIMEZONE, local_start_of_day

from ._base import GenericDjangoModelFactory

__all__ = [
    "AllocatedTimeSlotFactory",
]


class AllocatedTimeSlotFactory(GenericDjangoModelFactory[AllocatedTimeSlot]):
    class Meta:
        model = AllocatedTimeSlot

    day_of_the_week = fuzzy.FuzzyChoice(choices=Weekday.values)
    begin_time = datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE)
    end_time = datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE)

    reservation_unit_option = factory.SubFactory("tests.factories.ReservationUnitOptionFactory")

    @classmethod
    def create_ready_for_reservation(
        cls,
        *,
        num: int = 1,
        start_time: datetime.time | None = None,
        end_time: datetime.time | None = None,
        applicant_type: ApplicantTypeChoice = ApplicantTypeChoice.INDIVIDUAL,
    ) -> AllocatedTimeSlot:
        from .application_round import ApplicationRoundFactory
        from .opening_hours import OriginHaukiResourceFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory

        space = SpaceFactory.create()
        resource = OriginHaukiResourceFactory.create(id="987", opening_hours_hash="foo")

        reservation_unit = ReservationUnitFactory.create(
            origin_hauki_resource=resource,
            spaces=[space],
            unit=space.unit,
        )

        start_of_today = local_start_of_day()

        application_round = ApplicationRoundFactory.create_in_status_handled(
            reservation_units=[reservation_unit],
            reservation_period_begin=start_of_today.date(),
            reservation_period_end=(start_of_today + datetime.timedelta(days=7 * (num - 1))).date(),
        )

        return AllocatedTimeSlotFactory.create(
            day_of_the_week=Weekday.from_iso_week_day(start_of_today.isoweekday()),
            begin_time=start_time or datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE),
            end_time=end_time or datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE),
            reservation_unit_option__reservation_unit=reservation_unit,
            reservation_unit_option__application_section__application__application_round=application_round,
            reservation_unit_option__application_section__application__applicant_type=applicant_type,
        )
