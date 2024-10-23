import factory

from tilavarauspalvelu.models import ReservationUnitOption

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory


class ReservationUnitOptionFactory(GenericDjangoModelFactory[ReservationUnitOption]):
    class Meta:
        model = ReservationUnitOption

    preferred_order = factory.Sequence(lambda n: n)
    rejected = False
    locked = False

    application_section = ForeignKeyFactory("tests.factories.ApplicationSectionFactory")
    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")

    allocated_time_slots = ReverseForeignKeyFactory("tests.factories.AllocatedTimeSlotFactory")
