from factory import LazyAttribute

from tilavarauspalvelu.enums import ServiceTypeChoices
from tilavarauspalvelu.models import Service

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ServiceFactory",
]


class ServiceFactory(GenericDjangoModelFactory[Service]):
    class Meta:
        model = Service
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    service_type = ServiceTypeChoices.INTRODUCTION

    buffer_time_before = None
    buffer_time_after = None

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
