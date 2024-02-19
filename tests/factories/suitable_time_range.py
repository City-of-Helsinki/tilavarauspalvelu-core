import datetime

import factory
from django.utils.timezone import get_default_timezone
from factory import fuzzy

from applications.choices import Priority, Weekday
from applications.models import SuitableTimeRange

from ._base import GenericDjangoModelFactory

__all__ = [
    "SuitableTimeRangeFactory",
]


class SuitableTimeRangeFactory(GenericDjangoModelFactory[SuitableTimeRange]):
    class Meta:
        model = SuitableTimeRange

    priority = fuzzy.FuzzyChoice(choices=Priority.values)
    day_of_the_week = fuzzy.FuzzyChoice(choices=Weekday.values)
    begin_time = datetime.time(12, 0, tzinfo=get_default_timezone())
    end_time = datetime.time(14, 0, tzinfo=get_default_timezone())

    application_section = factory.SubFactory("tests.factories.ApplicationSectionFactory")
