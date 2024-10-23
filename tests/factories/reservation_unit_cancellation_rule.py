import datetime

from factory import LazyAttribute

from tilavarauspalvelu.models import ReservationUnitCancellationRule

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ReservationUnitCancellationRuleFactory",
]


class ReservationUnitCancellationRuleFactory(GenericDjangoModelFactory[ReservationUnitCancellationRule]):
    class Meta:
        model = ReservationUnitCancellationRule
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    needs_handling = False
    can_be_cancelled_time_before = datetime.timedelta(hours=24)

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
