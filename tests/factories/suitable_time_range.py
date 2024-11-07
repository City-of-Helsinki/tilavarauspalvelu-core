from __future__ import annotations

import datetime

from factory import fuzzy

from tilavarauspalvelu.enums import Priority, Weekday
from tilavarauspalvelu.models import SuitableTimeRange
from utils.date_utils import DEFAULT_TIMEZONE

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder

__all__ = [
    "SuitableTimeRangeFactory",
]


class SuitableTimeRangeFactory(GenericDjangoModelFactory[SuitableTimeRange]):
    class Meta:
        model = SuitableTimeRange

    priority = fuzzy.FuzzyChoice(choices=Priority.values)
    day_of_the_week = fuzzy.FuzzyChoice(choices=Weekday.values)
    begin_time = datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE)
    end_time = datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE)

    application_section = ForeignKeyFactory("tests.factories.ApplicationSectionFactory")


class SuitableTimeRangeBuilder(ModelFactoryBuilder[SuitableTimeRange]):
    factory = SuitableTimeRangeFactory
