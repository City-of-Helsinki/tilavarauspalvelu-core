from __future__ import annotations

import datetime

from factory import fuzzy

from tilavarauspalvelu.enums import ApplicantTypeChoice, Weekday
from tilavarauspalvelu.models import AllocatedTimeSlot
from utils.date_utils import DEFAULT_TIMEZONE, local_start_of_day

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ReverseOneToOneFactory

__all__ = [
    "AllocatedTimeSlotFactory",
]


class AllocatedTimeSlotFactory(GenericDjangoModelFactory[AllocatedTimeSlot]):
    class Meta:
        model = AllocatedTimeSlot

    day_of_the_week = fuzzy.FuzzyChoice(choices=Weekday.values)
    begin_time = datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE)
    end_time = datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE)

    reservation_unit_option = ForeignKeyFactory("tests.factories.ReservationUnitOptionFactory")
    reservation_series = ReverseOneToOneFactory("tests.factories.ReservationSeriesFactory")

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
        from .origin_hauki_resource import OriginHaukiResourceFactory
        from .reservation_unit import ReservationUnitFactory
        from .space import SpaceFactory

        space = SpaceFactory.create()
        resource = OriginHaukiResourceFactory.create(id=987, opening_hours_hash="foo")

        reservation_unit = ReservationUnitFactory.create(
            origin_hauki_resource=resource,
            spaces=[space],
            unit=space.unit,
        )

        start_of_today = local_start_of_day()

        application_round = ApplicationRoundFactory.create_in_status_handled(
            reservation_units=[reservation_unit],
            reservation_period_begin_date=start_of_today.date(),
            reservation_period_end_date=(start_of_today + datetime.timedelta(days=7 * (num - 1))).date(),
        )

        return cls.create(
            day_of_the_week=Weekday.from_iso_week_day(start_of_today.isoweekday()),
            begin_time=start_time or datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE),
            end_time=end_time or datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE),
            reservation_unit_option__reservation_unit=reservation_unit,
            reservation_unit_option__application_section__application__application_round=application_round,
            reservation_unit_option__application_section__application__applicant_type=applicant_type,
        )
