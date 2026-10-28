from __future__ import annotations

import datetime
import math
from collections import defaultdict
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db.models import Prefetch

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit
from tilavarauspalvelu.models import (
    PriceComponent,
    PriceOption,
    PricingGroup,
    Reservation,
    ReservationPriceLine,
    ReservationUnit,
    ReservationUnitPricing,
    ReservationUnitPricingGroup,
    UnitGroup,
)
from utils.date_utils import DEFAULT_TIMEZONE, local_date
from utils.decimal_utils import round_decimal

from .utils import with_logs

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.models import TaxLevel

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


def create_own_pricing_groups(reservation_units: QuerySet[ReservationUnit], *, tax_level: TaxLevel) -> None:
    """Make an own pricing group for each reservation unit, with one base component for each of its pricings."""
    pricings_by_begins = Prefetch("pricings", queryset=ReservationUnitPricing.objects.order_by("begins"))
    reservation_units_with_pricings = [
        reservation_unit
        for reservation_unit in reservation_units.prefetch_related(pricings_by_begins)
        if reservation_unit.pricings.all()
    ]

    pricing_groups = [
        PricingGroup(
            name=reservation_unit.name,
            name_fi=reservation_unit.name_fi,
            name_en=reservation_unit.name_en,
            name_sv=reservation_unit.name_sv,
            unit_group=None,
        )
        for reservation_unit in reservation_units_with_pricings
    ]
    PricingGroup.objects.bulk_create(pricing_groups)

    reservation_unit_pricing_groups: list[ReservationUnitPricingGroup] = []
    components: list[PriceComponent] = []

    for reservation_unit, pricing_group in zip(reservation_units_with_pricings, pricing_groups, strict=True):
        pricings: list[ReservationUnitPricing] = list(reservation_unit.pricings.all())

        reservation_unit_pricing_group = ReservationUnitPricingGroup(
            reservation_unit=reservation_unit,
            pricing_group=pricing_group,
            begins=pricings[0].begins,
        )
        reservation_unit_pricing_groups.append(reservation_unit_pricing_group)

        valid_until_dates = [pricing.begins for pricing in pricings[1:]] + [None]
        for pricing, valid_until in zip(pricings, valid_until_dates, strict=True):
            component = PriceComponent(
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
            components.append(component)

    ReservationUnitPricingGroup.objects.bulk_create(reservation_unit_pricing_groups)
    PriceComponent.objects.bulk_create(components)


@with_logs
def _create_reservation_price_lines() -> None:
    """
    Add one price line to each reservation, from the component that is active on the start date of the reservation.
    This is simpler than the real price calculation, which also splits a reservation at a price change.
    """
    reservation_unit_pricing_groups: dict[int, list[ReservationUnitPricingGroup]] = defaultdict(list)
    for reservation_unit_pricing_group in ReservationUnitPricingGroup.objects.order_by("-begins"):
        reservation_unit_id = reservation_unit_pricing_group.reservation_unit_id
        reservation_unit_pricing_groups[reservation_unit_id].append(reservation_unit_pricing_group)

    components_by_pricing_group: dict[int, list[PriceComponent]] = defaultdict(list)
    price_options_by_pricing_group: dict[int, PriceOption] = {}
    for component in PriceComponent.objects.select_related("price_option", "accounting").order_by("valid_from"):
        components_by_pricing_group[component.pricing_group_id].append(component)

        option = component.price_option
        if option is None:
            continue

        current_option = price_options_by_pricing_group.get(component.pricing_group_id)
        if current_option is None or option.name < current_option.name:
            price_options_by_pricing_group[component.pricing_group_id] = option

    reservations = Reservation.objects.filter(
        reservation_unit__in=list(reservation_unit_pricing_groups),
    ).select_related(
        "reservation_unit__payment_accounting",
        "reservation_unit__unit__payment_accounting",
    )

    price_lines: list[ReservationPriceLine] = []
    priced_reservations: list[Reservation] = []

    for reservation in reservations:
        if reservation.begins_at >= reservation.ends_at:
            continue

        begin_date = reservation.begins_at.astimezone(DEFAULT_TIMEZONE).date()
        pricing_group_id = next(
            (
                reservation_unit_pricing_group.pricing_group_id
                for reservation_unit_pricing_group in reservation_unit_pricing_groups[reservation.reservation_unit_id]
                if reservation_unit_pricing_group.begins <= begin_date
            ),
            None,
        )
        if pricing_group_id is None:
            continue

        price_option = price_options_by_pricing_group.get(pricing_group_id)
        component = next(
            (
                component
                for component in components_by_pricing_group[pricing_group_id]
                if component.valid_from <= begin_date
                and (component.valid_until is None or component.valid_until > begin_date)
                and (component.price_option_id is None or component.price_option == price_option)
            ),
            None,
        )
        if component is None:
            continue

        price_unit = PriceUnit(component.price_unit)
        duration_seconds = (reservation.ends_at - reservation.begins_at).total_seconds()
        duration_minutes = math.ceil(duration_seconds / 60 / 15) * 15

        if price_unit == PriceUnit.FIXED:
            quantity = Decimal(1)
        elif price_unit in {PriceUnit.PER_HALF_DAY, PriceUnit.PER_DAY, PriceUnit.PER_WEEK}:
            quantity = Decimal(math.ceil(duration_minutes / price_unit.in_minutes))
        else:
            quantity = Decimal(duration_minutes) / price_unit.in_minutes

        quantity = round_decimal(quantity, 4)
        amount = round_decimal(component.amount * quantity, 2)

        accounting = component.accounting
        if accounting is None:
            accounting = reservation.reservation_unit.actions.get_accounting()

        line_option = component.price_option

        line = ReservationPriceLine(
            reservation=reservation,
            price_component=component,
            description_fi=line_option.name_fi if line_option is not None else "",
            description_en=line_option.name_en if line_option is not None else "",
            description_sv=line_option.name_sv if line_option is not None else "",
            quantity=quantity,
            price_unit=component.price_unit,
            unit_amount=component.amount,
            amount_before_adjustment=amount,
            adjustment_percentage=Decimal(0),
            amount=amount,
            override_amount=None,
            tax_percentage=Decimal(0),
            vat_code="",
            accounting=accounting,
            payment_product=None,
        )
        price_lines.append(line)

        reservation.price = amount
        reservation.non_subsidised_price = amount
        priced_reservations.append(reservation)

    ReservationPriceLine.objects.filter(reservation__in=reservations).delete()
    ReservationPriceLine.objects.bulk_create(price_lines)
    Reservation.objects.bulk_update(priced_reservations, fields=["price", "non_subsidised_price"], batch_size=1000)


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
