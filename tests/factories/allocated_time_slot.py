import datetime

import factory
from django.utils.timezone import get_default_timezone
from factory import fuzzy

from applications.choices import Weekday
from applications.models import AllocatedTimeSlot

from ._base import GenericDjangoModelFactory

__all__ = [
    "AllocatedTimeSlotFactory",
]


class AllocatedTimeSlotFactory(GenericDjangoModelFactory[AllocatedTimeSlot]):
    class Meta:
        model = AllocatedTimeSlot

    day_of_the_week = fuzzy.FuzzyChoice(choices=Weekday.values)
    begin_time = datetime.time(12, 0, tzinfo=get_default_timezone())
    end_time = datetime.time(14, 0, tzinfo=get_default_timezone())

    reservation_unit_option = factory.SubFactory("tests.factories.ReservationUnitOptionFactory")
