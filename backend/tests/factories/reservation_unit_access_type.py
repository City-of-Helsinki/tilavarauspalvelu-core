from __future__ import annotations

import datetime

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.models import ReservationUnitAccessType, ReservationUnitPricing

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder

__all__ = [
    "ReservationUnitAccessTypeBuilder",
    "ReservationUnitAccessTypeFactory",
]


class ReservationUnitAccessTypeFactory(GenericDjangoModelFactory[ReservationUnitAccessType]):
    class Meta:
        model = ReservationUnitAccessType

    begin_date = datetime.date(2021, 1, 1)
    access_type = AccessType.UNRESTRICTED

    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory")


class ReservationUnitAccessTypeBuilder(ModelFactoryBuilder[ReservationUnitPricing]):
    factory = ReservationUnitAccessTypeFactory
