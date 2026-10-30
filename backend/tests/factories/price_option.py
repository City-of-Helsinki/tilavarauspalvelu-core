from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from factory import LazyAttribute

from tilavarauspalvelu.models import PriceOption

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound

__all__ = [
    "PriceOptionFactory",
]


class PriceOptionFactory(GenericDjangoModelFactory[PriceOption]):
    class Meta:
        model = PriceOption

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    description = ""
    is_active = True

    unit_group = ForeignKeyFactory("tests.factories.UnitGroupFactory", required=True)

    @classmethod
    def create_for_application_round(cls, application_round: ApplicationRound, **kwargs: Any) -> PriceOption:
        """Create a price option that every reservation unit of the application round has for the whole round."""
        from .price_component import PriceComponentFactory
        from .pricing_group import PricingGroupFactory
        from .reservation_unit_pricing_group import ReservationUnitPricingGroupFactory

        price_option = cls.create(**kwargs)
        pricing_group = PricingGroupFactory.create(unit_group=price_option.unit_group)
        PriceComponentFactory.create(
            pricing_group=pricing_group,
            price_option=price_option,
            valid_from=datetime.date(2021, 1, 1),
        )
        for reservation_unit in application_round.reservation_units.all():
            ReservationUnitPricingGroupFactory.create(
                reservation_unit=reservation_unit,
                pricing_group=pricing_group,
                begins=datetime.date(2021, 1, 1),
            )

        return price_option
