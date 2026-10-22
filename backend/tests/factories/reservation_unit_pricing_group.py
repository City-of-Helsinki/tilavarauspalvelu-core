from __future__ import annotations

import datetime

from tilavarauspalvelu.models import ReservationUnitPricingGroup

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "ReservationUnitPricingGroupFactory",
]


class ReservationUnitPricingGroupFactory(GenericDjangoModelFactory[ReservationUnitPricingGroup]):
    class Meta:
        model = ReservationUnitPricingGroup

    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory", required=True)
    pricing_group = ForeignKeyFactory("tests.factories.PricingGroupFactory", required=True)
    begins = datetime.date(2021, 1, 1)
