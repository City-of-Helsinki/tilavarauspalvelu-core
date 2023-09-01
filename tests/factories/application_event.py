import datetime

import factory
from factory import fuzzy

from applications.models import ApplicationEvent, ApplicationEventStatus, EventReservationUnit

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationEventFactory",
    "ApplicationEventStatusFactory",
    "EventReservationUnitFactory",
]


class ApplicationEventFactory(GenericDjangoModelFactory[ApplicationEvent]):
    class Meta:
        model = ApplicationEvent

    name = fuzzy.FuzzyText()
    application = factory.SubFactory("tests.factories.ApplicationFactory")
    min_duration = "01:00"
    max_duration = "02:00"
    events_per_week = fuzzy.FuzzyInteger(low=1, high=4)
    purpose = factory.SubFactory("tests.factories.ReservationPurposeFactory")
    age_group = factory.SubFactory("tests.factories.AgeGroupFactory")
    begin = fuzzy.FuzzyDate(
        start_date=datetime.date.today(),
        end_date=datetime.date.today(),
    )
    end = fuzzy.FuzzyDate(
        start_date=(datetime.date.today() + datetime.timedelta(days=1)),
        end_date=(datetime.date.today() + datetime.timedelta(weeks=4)),
    )

    @factory.post_generation
    def declined_reservation_units(self, create, declined_reservation_units, **kwargs):
        if not create or not declined_reservation_units:
            return

        for reservation_unit in declined_reservation_units:
            self.declined_reservation_units.add(reservation_unit)

    @factory.post_generation
    def set_dates(self, *args, **kwargs):
        if not self.begin:
            self.begin = self.application.application_round.reservation_period_begin
        if not self.end:
            self.end = self.application.application_round.reservation_period_end


class ApplicationEventStatusFactory(GenericDjangoModelFactory[ApplicationEventStatus]):
    class Meta:
        model = ApplicationEventStatus

    status = fuzzy.FuzzyChoice(
        choices=[
            ApplicationEventStatus.CREATED,
            ApplicationEventStatus.APPROVED,
            ApplicationEventStatus.RESERVED,
            ApplicationEventStatus.FAILED,
            ApplicationEventStatus.DECLINED,
        ]
    )
    application_event = factory.SubFactory("tests.factories.ApplicationEventFactory")


class EventReservationUnitFactory(GenericDjangoModelFactory[EventReservationUnit]):
    class Meta:
        model = EventReservationUnit

    application_event = factory.SubFactory("tests.factories.ApplicationEventFactory")
    priority = fuzzy.FuzzyInteger(low=0, high=1000, step=100)
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
