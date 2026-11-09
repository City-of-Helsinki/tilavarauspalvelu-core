from __future__ import annotations

import dataclasses
import datetime
from collections import defaultdict
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit, ReservationTypeChoice
from tilavarauspalvelu.models import (
    PriceComponent,
    PriceOption,
    PricingGroup,
    Reservation,
    ReservationPriceLine,
    ReservationUnit,
    ReservationUnitPricingGroup,
    SalesItem,
    UnitGroup,
)
from tilavarauspalvelu.services.pricing.price_calculation import load_pricing_data
from tilavarauspalvelu.services.pricing.price_lines import build_price_lines_with_data
from utils.date_utils import DEFAULT_TIMEZONE, local_date

from .utils import with_logs

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxLevel

    from .utils import TaxLevelKey


@dataclasses.dataclass(frozen=True, slots=True, kw_only=True)
class OwnPrice:
    """One base price of a reservation unit. It lasts until the next own price of the same reservation unit begins."""

    reservation_unit: ReservationUnit
    begins: datetime.date
    amount: Decimal
    price_unit: PriceUnit
    tax_level: TaxLevel
    can_apply_for_discount: bool = False
    material_price_description_fi: str = ""
    material_price_description_en: str = ""
    material_price_description_sv: str = ""


def create_own_prices(prices: list[OwnPrice]) -> None:
    """
    Make an own pricing group for each reservation unit in the given prices, with one base component for each price.
    The paid components of a reservation unit that is paid online get the sales item of their tax level.
    The reservation units must be saved first.
    """
    prices_by_reservation_unit: dict[int, list[OwnPrice]] = defaultdict(list)
    reservation_units: dict[int, ReservationUnit] = {}
    for price in prices:
        prices_by_reservation_unit[price.reservation_unit.pk].append(price)
        reservation_units[price.reservation_unit.pk] = price.reservation_unit

    pricing_groups = {
        pk: PricingGroup(
            name=reservation_unit.name,
            name_fi=reservation_unit.name_fi,
            name_en=reservation_unit.name_en,
            name_sv=reservation_unit.name_sv,
            unit_group=None,
        )
        for pk, reservation_unit in reservation_units.items()
    }
    PricingGroup.objects.bulk_create(pricing_groups.values())

    sales_items: dict[int, SalesItem] = {}
    reservation_unit_pricing_groups: list[ReservationUnitPricingGroup] = []
    components: list[PriceComponent] = []

    for pk, unit_prices in prices_by_reservation_unit.items():
        reservation_unit = reservation_units[pk]
        pricing_group = pricing_groups[pk]
        sorted_prices = sorted(unit_prices, key=lambda price: price.begins)
        is_paid_online = reservation_unit.payment_type in PaymentType.requires_verkkokauppa

        reservation_unit_pricing_group = ReservationUnitPricingGroup(
            reservation_unit=reservation_unit,
            pricing_group=pricing_group,
            begins=sorted_prices[0].begins,
        )
        reservation_unit_pricing_groups.append(reservation_unit_pricing_group)

        valid_until_dates = [price.begins for price in sorted_prices[1:]] + [None]
        for price, valid_until in zip(sorted_prices, valid_until_dates, strict=True):
            sales_item: SalesItem | None = None
            if is_paid_online and price.amount > 0:
                if price.tax_level.pk not in sales_items:
                    sales_items[price.tax_level.pk] = get_or_create_sales_item(tax_level=price.tax_level)
                sales_item = sales_items[price.tax_level.pk]

            component = PriceComponent(
                pricing_group=pricing_group,
                kind=PriceComponentKind.BASE,
                valid_from=price.begins,
                valid_until=valid_until,
                price_option=None,
                amount=price.amount,
                price_unit=price.price_unit,
                can_apply_for_discount=price.can_apply_for_discount and price.amount > 0,
                material_price_description_fi=price.material_price_description_fi,
                material_price_description_en=price.material_price_description_en,
                material_price_description_sv=price.material_price_description_sv,
                tax_level=price.tax_level,
                sales_item=sales_item,
            )
            components.append(component)

    ReservationUnitPricingGroup.objects.bulk_create(reservation_unit_pricing_groups)
    PriceComponent.objects.bulk_create(components)


@with_logs
def _create_shared_pricing_group(*, tax_levels: dict[TaxLevelKey, TaxLevel]) -> None:
    general_tax_level = tax_levels["general"]
    _move_to_shared_pricing_group(
        tax_level=general_tax_level,
        sales_item=get_or_create_sales_item(tax_level=general_tax_level),
    )


def get_or_create_sales_item(*, tax_level: TaxLevel) -> SalesItem:
    """Get or make one sales item for the tax level. The material is made up for the test data."""
    sales_item, _ = SalesItem.objects.get_or_create(
        material=f"{10_000_000 + tax_level.pk}",
        defaults={
            "name": f"Tilavuokrat, {tax_level.name}",
            "main_ledger_account": "340025",
            "tax_level": tax_level,
        },
    )
    return sales_item


@with_logs
def _create_reservation_price_lines() -> None:
    """
    Give each reservation without price lines the price lines of the price calculation, and its price from them.
    A reservation in a shared pricing group without a price option uses the first option of the group by name.
    Reservations that staff make are free, so their lines are overridden to zero.
    """
    reservations = list(
        Reservation.objects
        .filter(price_lines__isnull=True)
        .select_related("reservation_unit", "price_option")
        .order_by("pk")
    )
    reservation_unit_pks = {reservation.reservation_unit_id for reservation in reservations}
    pricing_data = load_pricing_data(reservation_unit_pks=reservation_unit_pks)

    default_options: dict[int, PriceOption] = {}
    for component in PriceComponent.objects.filter(price_option__isnull=False).select_related("price_option"):
        option = component.price_option
        current_option = default_options.get(component.pricing_group_id)
        if current_option is None or option.name < current_option.name:
            default_options[component.pricing_group_id] = option

    price_lines: list[ReservationPriceLine] = []

    for reservation in reservations:
        price_option = reservation.price_option
        if price_option is None:
            begin_date = reservation.begins_at.astimezone(DEFAULT_TIMEZONE).date()
            pricing_group_row = pricing_data.pricing_group_row(
                reservation_unit_pk=reservation.reservation_unit_id,
                on_date=begin_date,
            )
            price_option = default_options.get(pricing_group_row.pricing_group_id)

        reservation_price_lines = build_price_lines_with_data(
            pricing_data=pricing_data,
            reservation_unit=reservation.reservation_unit,
            price_option=price_option,
            begin=reservation.begins_at,
            end=reservation.ends_at,
        )

        is_free = reservation.type in ReservationTypeChoice.types_that_staff_can_create
        for line in reservation_price_lines.lines:
            line.reservation = reservation
            if is_free:
                line.override_amount = Decimal(0)
            price_lines.append(line)

        first_line = reservation_price_lines.lines[0]
        reservation.non_subsidised_price = reservation_price_lines.calculation.total
        reservation.price = Decimal(0) if is_free else reservation_price_lines.calculation.total
        reservation.unit_price = first_line.unit_amount
        reservation.tax_percentage_value = first_line.tax_percentage

    ReservationPriceLine.objects.bulk_create(price_lines, batch_size=1000)
    Reservation.objects.bulk_update(
        reservations,
        fields=["price", "non_subsidised_price", "unit_price", "tax_percentage_value"],
        batch_size=1000,
    )


# Internals


def _move_to_shared_pricing_group(*, tax_level: TaxLevel, sales_item: SalesItem) -> None:
    """
    Make a shared pricing group with two price options and a price change in the future,
    and move two paid reservation units of the first unit group from their own pricing groups to it.
    """
    unit_group = UnitGroup.objects.order_by("pk").first()
    if unit_group is None:
        return

    reservation_units = list(
        ReservationUnit.objects
        .filter(
            unit__unit_groups=unit_group,
            reservation_unit_pricing_groups__pricing_group__components__amount__gt=0,
        )
        .distinct()
        .order_by("pk")[:2]
    )
    if not reservation_units:
        return

    for reservation_unit in reservation_units:
        reservation_unit.payment_type = PaymentType.ONLINE
    ReservationUnit.objects.bulk_update(reservation_units, fields=["payment_type"])

    own_rows = ReservationUnitPricingGroup.objects.filter(reservation_unit__in=reservation_units)
    own_pricing_group_pks = list(own_rows.values_list("pricing_group", flat=True))

    # The shared group begins when the own groups began, so that it covers the existing reservations.
    begins = min(own_rows.values_list("begins", flat=True))
    price_change = local_date() + datetime.timedelta(days=60)

    own_rows.delete()
    PricingGroup.objects.filter(pk__in=own_pricing_group_pks).delete()

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
            tax_level=tax_level,
            sales_item=sales_item,
        ),
        PriceComponent(
            pricing_group=pricing_group,
            kind=PriceComponentKind.BASE,
            valid_from=price_change,
            valid_until=None,
            price_option=adults,
            amount=Decimal(25),
            price_unit=PriceUnit.PER_HOUR,
            tax_level=tax_level,
            sales_item=sales_item,
        ),
        PriceComponent(
            pricing_group=pricing_group,
            kind=PriceComponentKind.BASE,
            valid_from=begins,
            valid_until=None,
            price_option=juniors,
            amount=Decimal(10),
            price_unit=PriceUnit.PER_HOUR,
            tax_level=tax_level,
            sales_item=sales_item,
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
