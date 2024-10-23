from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.models import AgeGroup

from ._base import GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "AgeGroupFactory",
]


class AgeGroupFactory(GenericDjangoModelFactory[AgeGroup]):
    class Meta:
        model = AgeGroup
        django_get_or_create = ["minimum", "maximum"]

    minimum = fuzzy.FuzzyInteger(low=0, high=99)
    maximum = LazyAttribute(lambda i: min(i.minimum + 20, 100))

    application_sections = ReverseForeignKeyFactory("tests.factories.ApplicationSectionFactory")
    recurring_reservations = ReverseForeignKeyFactory("tests.factories.RecurringReservationFactory")
    reservations = ReverseForeignKeyFactory("tests.factories.ReservationFactory")
