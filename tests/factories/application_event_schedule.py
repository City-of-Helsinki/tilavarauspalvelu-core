import datetime

import factory
from django.utils import timezone
from factory import fuzzy

from applications.models import PRIORITIES, ApplicationEventSchedule, ApplicationEventScheduleResult

from ._base import GenericDjangoModelFactory

__all__ = [
    "ApplicationEventScheduleFactory",
    "ApplicationEventScheduleResultFactory",
]


class ApplicationEventScheduleFactory(GenericDjangoModelFactory[ApplicationEventSchedule]):
    class Meta:
        model = ApplicationEventSchedule

    day = fuzzy.FuzzyInteger(low=0, high=6)
    begin = datetime.time(12, 0, tzinfo=timezone.get_default_timezone())
    end = datetime.time(14, 0, tzinfo=timezone.get_default_timezone())
    application_event = factory.SubFactory("tests.factories.ApplicationEventFactory")
    priority = fuzzy.FuzzyChoice(choices=[choice[0] for choice in PRIORITIES.PRIORITY_CHOICES])


class ApplicationEventScheduleResultFactory(GenericDjangoModelFactory[ApplicationEventScheduleResult]):
    class Meta:
        model = ApplicationEventScheduleResult

    application_event_schedule = factory.SubFactory("tests.factories.ApplicationEventScheduleFactory")
    allocated_reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
    allocated_duration = "01:00"
    allocated_day = fuzzy.FuzzyInteger(low=0, high=6)
    allocated_begin = datetime.time(12, 0, tzinfo=timezone.get_default_timezone())
    allocated_end = datetime.time(14, 0, tzinfo=timezone.get_default_timezone())
