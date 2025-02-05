from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import AbilityGroup

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "AbilityGroupFactory",
]


class AbilityGroupFactory(GenericDjangoModelFactory[AbilityGroup]):
    class Meta:
        model = AbilityGroup
        django_get_or_create = ["name"]

    name = FakerFI("name", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("name")
    name_sv = FakerSV("name")

    recurring_reservations = ReverseForeignKeyFactory("tests.factories.RecurringReservationFactory")
