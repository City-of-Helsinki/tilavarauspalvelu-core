from __future__ import annotations

from typing import TYPE_CHECKING, Self

import factory

from tilavarauspalvelu.models import ReservationUnitOption

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder, ReverseForeignKeyFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationSection


class ReservationUnitOptionFactory(GenericDjangoModelFactory[ReservationUnitOption]):
    class Meta:
        model = ReservationUnitOption

    preferred_order = factory.Sequence(lambda n: n)
    rejected = False
    locked = False

    application_section = ForeignKeyFactory("tests.factories.ApplicationSectionFactory")
    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")

    allocated_time_slots = ReverseForeignKeyFactory("tests.factories.AllocatedTimeSlotFactory")


class ReservationUnitOptionBuilder(ModelFactoryBuilder[ReservationUnitOption]):
    factory = ReservationUnitOptionFactory

    def in_application_section(self, application_section: ApplicationSection) -> Self:
        for key in list(self.kwargs):
            if key.startswith("application_section"):
                del self.kwargs[key]

        self.kwargs.setdefault("application_section", application_section)
        return self
