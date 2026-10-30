from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit
from tilavarauspalvelu.models import (
    PriceComponent,
    PriceOption,
    PricingGroup,
    ReservationUnit,
    ReservationUnitPricingGroup,
    UnitGroup,
)
from utils.date_utils import local_date

from .utils import with_logs

if TYPE_CHECKING:
    from collections.abc import Iterable

    from tilavarauspalvelu.models import ReservationUnitPricing, TaxLevel

    from .utils import TaxLevelKey


@with_logs
def _create_pricing_groups(*, tax_levels: dict[TaxLevelKey, TaxLevel]) -> None:
    tax_level = tax_levels["general"]
    shared_reservation_units = _create_shared_pricing_group(tax_level=tax_level)

    reservation_units = (
        ReservationUnit.objects
        .filter(pricings__isnull=False)
        .exclude(pk__in=[reservation_unit.pk for reservation_unit in shared_reservation_units])
        .distinct()
    )
    create_own_pricing_groups(reservation_units, tax_level=tax_level)


def create_own_pricing_groups(reservation_units: Iterable[ReservationUnit], *, tax_level: TaxLevel) -> None:
    """Make an own pricing group for each reservation unit, with one base component for each of its pricings."""
    for reservation_unit in reservation_units:
        pricings: list[ReservationUnitPricing] = list(reservation_unit.pricings.order_by("begins"))
        if not pricings:
            continue

        pricing_group = PricingGroup.objects.create(
            name=reservation_unit.name,
            name_fi=reservation_unit.name_fi,
            name_en=reservation_unit.name_en,
            name_sv=reservation_unit.name_sv,
            unit_group=None,
        )
        ReservationUnitPricingGroup.objects.create(
            reservation_unit=reservation_unit,
            pricing_group=pricing_group,
            begins=pricings[0].begins,
        )

        valid_until_dates = [pricing.begins for pricing in pricings[1:]] + [None]
        components = [
            PriceComponent(
                pricing_group=pricing_group,
                kind=PriceComponentKind.BASE,
                valid_from=pricing.begins,
                valid_until=valid_until,
                price_option=None,
                amount=pricing.highest_price,
                price_unit=pricing.price_unit,
                can_apply_for_discount=reservation_unit.can_apply_free_of_charge and pricing.highest_price > 0,
                material_price_description_fi=pricing.material_price_description_fi or "",
                material_price_description_en=pricing.material_price_description_en or "",
                material_price_description_sv=pricing.material_price_description_sv or "",
                payment_type=(pricing.payment_type or PaymentType.ON_SITE) if pricing.highest_price > 0 else None,
                tax_level=tax_level,
            )
            for pricing, valid_until in zip(pricings, valid_until_dates, strict=True)
        ]
        PriceComponent.objects.bulk_create(components)


# Internals


def _create_shared_pricing_group(*, tax_level: TaxLevel) -> list[ReservationUnit]:
    """
    Make a shared pricing group with two price options and a price change in the future,
    and move two reservation units of the first unit group to it.
    """
    unit_group = UnitGroup.objects.order_by("pk").first()
    if unit_group is None:
        return []

    reservation_units = list(ReservationUnit.objects.filter(unit__unit_groups=unit_group).order_by("pk")[:2])
    if not reservation_units:
        return []

    today = local_date()
    begins = today - datetime.timedelta(days=365)
    price_change = today + datetime.timedelta(days=60)

    adults = PriceOption.objects.create(
        name="Aikuiset",
        name_fi="Aikuiset",
        name_en="Adults",
        name_sv="Vuxna",
        description="Yli 20-vuotiaat",
        description_fi="Yli 20-vuotiaat",
        description_en="Over 20 years old",
        description_sv="Över 20 år",
        unit_group=unit_group,
    )
    juniors = PriceOption.objects.create(
        name="Juniorit",
        name_fi="Juniorit",
        name_en="Juniors",
        name_sv="Juniorer",
        description="Alle 20-vuotiaat",
        description_fi="Alle 20-vuotiaat",
        description_en="Under 20 years old",
        description_sv="Under 20 år",
        unit_group=unit_group,
    )

    pricing_group = PricingGroup.objects.create(
        name="Liikunta, hintaryhmä 1",
        name_fi="Liikunta, hintaryhmä 1",
        name_en="Sports, price category 1",
        name_sv="Idrott, priskategori 1",
        unit_group=unit_group,
    )

    PriceComponent.objects.bulk_create([
        PriceComponent(
            pricing_group=pricing_group,
            kind=PriceComponentKind.BASE,
            valid_from=begins,
            valid_until=price_change,
            price_option=adults,
            amount=Decimal(20),
            price_unit=PriceUnit.PER_HOUR,
            payment_type=PaymentType.ONLINE,
            tax_level=tax_level,
        ),
        PriceComponent(
            pricing_group=pricing_group,
            kind=PriceComponentKind.BASE,
            valid_from=price_change,
            valid_until=None,
            price_option=adults,
            amount=Decimal(25),
            price_unit=PriceUnit.PER_HOUR,
            payment_type=PaymentType.ONLINE,
            tax_level=tax_level,
        ),
        PriceComponent(
            pricing_group=pricing_group,
            kind=PriceComponentKind.BASE,
            valid_from=begins,
            valid_until=None,
            price_option=juniors,
            amount=Decimal(10),
            price_unit=PriceUnit.PER_HOUR,
            payment_type=PaymentType.ONLINE,
            tax_level=tax_level,
            can_apply_for_discount=True,
        ),
    ])

    ReservationUnitPricingGroup.objects.bulk_create([
        ReservationUnitPricingGroup(
            reservation_unit=reservation_unit,
            pricing_group=pricing_group,
            begins=begins,
        )
        for reservation_unit in reservation_units
    ])

    return reservation_units
