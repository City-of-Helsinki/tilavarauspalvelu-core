from factory import LazyAttribute

from tilavarauspalvelu.models import ReservationPurpose

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ManyToManyFactory, ReverseForeignKeyFactory

__all__ = [
    "ReservationPurposeFactory",
]


class ReservationPurposeFactory(GenericDjangoModelFactory[ReservationPurpose]):
    class Meta:
        model = ReservationPurpose

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    application_rounds = ManyToManyFactory("tests.factories.ApplicationRoundFactory")
    application_sections = ReverseForeignKeyFactory("tests.factories.ApplicationSectionFactory")
    reservations = ReverseForeignKeyFactory("tests.factories.ReservationFactory")
