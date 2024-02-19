from collections.abc import Iterable
from typing import Any

import factory

from applications.models import AllocatedTimeSlot, ReservationUnitOption
from tests.factories import AllocatedTimeSlotFactory
from tests.factories._base import GenericDjangoModelFactory


class ReservationUnitOptionFactory(GenericDjangoModelFactory[ReservationUnitOption]):
    class Meta:
        model = ReservationUnitOption

    preferred_order = factory.Sequence(lambda n: n)
    rejected = False
    locked = False

    application_section = factory.SubFactory("tests.factories.ApplicationSectionFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")

    @factory.post_generation
    def allocated_time_slots(
        self,
        create: bool,
        allocated_time_slots: Iterable[AllocatedTimeSlot] | None,
        **kwargs: Any,
    ) -> None:
        if not create:
            return

        if not allocated_time_slots and kwargs:
            kwargs.setdefault("reservation_unit_option", self)
            AllocatedTimeSlotFactory.create(**kwargs)
