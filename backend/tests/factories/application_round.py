from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any, Self

import factory
from factory import LazyAttribute

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice
from tilavarauspalvelu.models import (
    AllocatedTimeSlot,
    ApplicationRound,
    ApplicationSection,
    Reservation,
    ReservationSeries,
    ReservationUnitOption,
)
from utils.date_utils import (
    DEFAULT_TIMEZONE,
    get_periods_between,
    local_datetime,
    local_start_of_day,
    next_date_matching_weekday,
)

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ModelFactoryBuilder,
    coerce_date,
)

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models import ReservationUnit, User
    from tilavarauspalvelu.typing import Allocation

__all__ = [
    "ApplicationRoundBuilder",
    "ApplicationRoundFactory",
]


class ApplicationRoundFactory(GenericDjangoModelFactory[ApplicationRound]):
    class Meta:
        model = ApplicationRound
        exclude = ["timestamp"]

    name = FakerFI("name")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("name")
    name_sv = FakerSV("name")

    criteria = FakerFI("sentence")
    criteria_fi = LazyAttribute(lambda i: i.name)
    criteria_en = FakerEN("sentence")
    criteria_sv = FakerSV("sentence")

    notes_when_applying = FakerFI("sentence")
    notes_when_applying_fi = LazyAttribute(lambda i: i.name)
    notes_when_applying_en = FakerEN("sentence")
    notes_when_applying_sv = FakerSV("sentence")

    timestamp = factory.LazyFunction(local_start_of_day)  # private helper (see Meta.exclude)

    application_period_begins_at = factory.LazyAttribute(lambda i: i.timestamp)
    application_period_ends_at = factory.LazyAttribute(
        lambda i: i.application_period_begins_at + datetime.timedelta(weeks=4)
    )

    reservation_period_begin_date = factory.LazyAttribute(
        lambda i: coerce_date(i.application_period_ends_at) + datetime.timedelta(days=1),
    )
    reservation_period_end_date = factory.LazyAttribute(
        lambda i: coerce_date(i.reservation_period_begin_date) + datetime.timedelta(weeks=4),
    )

    public_display_begins_at = factory.LazyAttribute(
        lambda i: i.application_period_begins_at - datetime.timedelta(days=7)
    )
    public_display_ends_at = factory.LazyAttribute(lambda i: i.application_period_ends_at + datetime.timedelta(days=4))

    handled_at = None
    sent_at = None

    reservation_units = ManyToManyFactory("tests.factories.ReservationUnitFactory")
    purposes = ManyToManyFactory("tests.factories.ReservationPurposeFactory")
    terms_of_use = ForeignKeyFactory("tests.factories.TermsOfUseFactory")

    @classmethod
    def create_in_status(cls, status: ApplicationRoundStatusChoice, **kwargs: Any) -> ApplicationRound:
        match status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return cls.create_in_status_upcoming(**kwargs)
            case ApplicationRoundStatusChoice.OPEN:
                return cls.create_in_status_open(**kwargs)
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return cls.create_in_status_in_allocation(**kwargs)
            case ApplicationRoundStatusChoice.HANDLED:
                return cls.create_in_status_handled(**kwargs)
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return cls.create_in_status_results_sent(**kwargs)

    @classmethod
    def create_in_status_upcoming(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().upcoming().create(**kwargs)

    @classmethod
    def create_in_status_open(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().open().create(**kwargs)

    @classmethod
    def create_in_status_in_allocation(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().in_allocation().create(**kwargs)

    @classmethod
    def create_in_status_handled(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().handled().create(**kwargs)

    @classmethod
    def create_in_status_results_sent(cls, **kwargs: Any) -> ApplicationRound:
        return ApplicationRoundBuilder().results_sent().create(**kwargs)

    @classmethod
    def create_with_allocations(
        cls,
        *,
        allocations: list[Allocation],
        reservation_period_begin_date: datetime.date,
        reservation_period_end_date: datetime.date,
        user: User,
        with_reservations: bool = False,
    ) -> ApplicationRound:
        """
        Helper for creating a application round which has been handled and has the following allocations.
        Creates a single application with a separate application section for each allocation.
        """
        from .age_group import AgeGroupFactory
        from .allocated_time_slot import AllocatedTimeSlotFactory
        from .application import ApplicationFactory
        from .application_section import ApplicationSectionFactory
        from .reservation import ReservationFactory
        from .reservation_purpose import ReservationPurposeFactory
        from .reservation_series import ReservationSeriesFactory
        from .reservation_unit_option import ReservationUnitOptionFactory

        purpose = ReservationPurposeFactory.create()
        age_group = AgeGroupFactory.create()

        application_round = (
            ApplicationRoundBuilder()
            .handled()
            .create(
                reservation_period_begin_date=reservation_period_begin_date,
                reservation_period_end_date=reservation_period_end_date,
                purposes=[purpose],
            )
        )

        ApplicationRoundReservationUnit: type[models.Model] = ApplicationRound.reservation_units.through

        sections: list[ApplicationSection] = []
        options: list[ReservationUnitOption] = []
        allocated_time_slots: list[AllocatedTimeSlot] = []
        allocation_series: list[ReservationSeries] = []
        reservations: list[Reservation] = []
        application_round_reservation_units: list[models.Model] = []
        reservation_units: list[ReservationUnit] = []

        application = ApplicationFactory.create(
            application_round=application_round,
            user=user,
            cancelled_at=None,
            sent_at=local_datetime(),
            in_allocation_notification_sent_at=local_datetime(),
        )

        for allocation in allocations:
            application_round_reservation_unit = ApplicationRoundReservationUnit(
                applicationround=application_round,
                reservationunit=allocation["reservation_unit"],
            )
            if allocation["reservation_unit"] not in reservation_units:
                reservation_units.append(allocation["reservation_unit"])
                application_round_reservation_units.append(application_round_reservation_unit)

            section = ApplicationSectionFactory.build(
                application=application,
                applied_reservations_per_week=1,
                purpose=purpose,
                age_group=age_group,
            )
            sections.append(section)

            option = ReservationUnitOptionFactory.build(
                application_section=section,
                reservation_unit=allocation["reservation_unit"],
            )
            options.append(option)

            allocated_time_slot = AllocatedTimeSlotFactory.build(
                day_of_the_week=allocation["day_of_the_week"],
                begin_time=allocation["begin_time"],
                end_time=allocation["end_time"],
                reservation_unit_option=option,
            )
            allocated_time_slots.append(allocated_time_slot)

            if with_reservations:
                series = ReservationSeriesFactory.build(
                    weekdays=str(allocation["day_of_the_week"]),
                    begin_date=reservation_period_begin_date,
                    begin_time=allocation["begin_time"],
                    end_date=reservation_period_end_date,
                    end_time=allocation["begin_time"],
                    user=user,
                    age_group=age_group,
                    allocated_time_slot=allocated_time_slot,
                    reservation_unit=allocation["reservation_unit"],
                )
                allocation_series.append(series)

                reservation_times = get_periods_between(
                    start_date=next_date_matching_weekday(
                        date=reservation_period_begin_date,
                        weekday=allocation["day_of_the_week"],
                    ),
                    end_date=reservation_period_end_date,
                    start_time=allocation["begin_time"],
                    end_time=allocation["end_time"],
                    tzinfo=DEFAULT_TIMEZONE,
                )

                for begin, end in reservation_times:
                    reservation = ReservationFactory.build(
                        begins_at=begin,
                        ends_at=end,
                        user=user,
                        purpose=purpose,
                        age_group=age_group,
                        reservation_series=series,
                        reservation_unit=allocation["reservation_unit"],
                    )
                    reservations.append(reservation)

        ApplicationSection.objects.bulk_create(sections)
        ReservationUnitOption.objects.bulk_create(options)
        AllocatedTimeSlot.objects.bulk_create(allocated_time_slots)
        ReservationSeries.objects.bulk_create(allocation_series)
        Reservation.objects.bulk_create(reservations)
        ApplicationRoundReservationUnit.objects.bulk_create(application_round_reservation_units)

        return application_round


class ApplicationRoundBuilder(ModelFactoryBuilder[ApplicationRound]):
    factory = ApplicationRoundFactory

    def with_status(self, status: ApplicationRoundStatusChoice) -> Self:
        match status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return self.upcoming()
            case ApplicationRoundStatusChoice.OPEN:
                return self.open()
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return self.in_allocation()
            case ApplicationRoundStatusChoice.HANDLED:
                return self.handled()
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return self.results_sent()

    def upcoming(self) -> Self:
        now = local_start_of_day()
        return self.set(
            sent_at=None,
            handled_at=None,
            application_period_begins_at=now + datetime.timedelta(days=2),
            application_period_ends_at=now + datetime.timedelta(days=4),
        )

    def open(self) -> Self:
        now = local_start_of_day()
        return self.set(
            sent_at=None,
            handled_at=None,
            application_period_begins_at=now - datetime.timedelta(days=2),
            application_period_ends_at=now + datetime.timedelta(days=2),
        )

    def in_allocation(self) -> Self:
        now = local_start_of_day()
        return self.set(
            sent_at=None,
            handled_at=None,
            application_period_begins_at=now - datetime.timedelta(days=4),
            application_period_ends_at=now - datetime.timedelta(days=2),
        )

    def handled(self) -> Self:
        now = local_start_of_day()
        return self.set(
            sent_at=None,
            handled_at=now,
            application_period_begins_at=now - datetime.timedelta(days=4),
            application_period_ends_at=now - datetime.timedelta(days=2),
        )

    def results_sent(self) -> Self:
        now = local_start_of_day()
        return self.set(
            sent_at=now,
            handled_at=now,
            application_period_begins_at=now - datetime.timedelta(days=4),
            application_period_ends_at=now - datetime.timedelta(days=2),
        )
