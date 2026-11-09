from __future__ import annotations

import dataclasses
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.core.management import BaseCommand, CommandError

from tilavarauspalvelu.models import (
    Reservation,
    ReservationUnit,
    ReservationUnitPricing,
    ReservationUnitPricingGroup,
    SalesItem,
    TaxLevel,
    TaxLevelRate,
)
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import PaymentAccounting

ONLINE_PAYMENT_TYPES = {"ONLINE", "ONLINE_OR_INVOICE"}
FREE_PRICE_TAX_LEVEL_NAME = "Veroton"


@dataclasses.dataclass(frozen=True, slots=True)
class SalesItemSource:
    material: str
    main_ledger_account: str
    tax_level_id: int
    description: str


class Command(BaseCommand):
    help = (
        "Lists the data that stops the migrations 0192 and 0194 (TILA-4545). Changes nothing. "
        "Run it in production before the release that has these migrations. "
        "It reads only the models of the release before them, so it can be copied to a running pod."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        errors = [*_pricing_group_errors(), *_price_line_errors()]
        if errors:
            error_texts = "\n- ".join(errors)
            msg = f"The pricing migrations would stop:\n- {error_texts}"
            raise CommandError(msg)

        self.stdout.write("No conflicts. The pricing migrations can run.")


# Internals


def _pricing_group_errors() -> list[str]:
    """The same checks as in the migration 0192."""
    today = local_date()

    units_with_pricing_group = set(
        ReservationUnitPricingGroup.objects.values_list("reservation_unit_id", flat=True).distinct()
    )
    reservation_units = list(
        ReservationUnit.objects
        .exclude(pk__in=units_with_pricing_group)
        .select_related("payment_accounting", "unit__payment_accounting")
        .order_by("pk")
    )

    pricings_by_unit: dict[int, list[ReservationUnitPricing]] = {}
    pricings = ReservationUnitPricing.objects.filter(reservation_unit__in=reservation_units).order_by("begins")
    for pricing in pricings:
        pricings_by_unit.setdefault(pricing.reservation_unit_id, []).append(pricing)

    errors: list[str] = []
    sources_by_material: dict[str, list[SalesItemSource]] = {}
    sources_without_material: dict[tuple[int, str], list[SalesItemSource]] = {}

    for reservation_unit in reservation_units:
        unit_pricings = pricings_by_unit.get(reservation_unit.pk, [])
        if unit_pricings and unit_pricings[0].begins > today:
            errors.append(
                f"Reservation unit {reservation_unit.pk} '{reservation_unit.name}' has no pricing today. "
                f"Its first pricing begins on {unit_pricings[0].begins.isoformat()}."
            )
            continue

        accounting: PaymentAccounting | None = reservation_unit.payment_accounting
        if accounting is None and reservation_unit.unit is not None:
            accounting = reservation_unit.unit.payment_accounting

        for pricing in _active_and_future_pricings(pricings=unit_pricings, today=today):
            if not _is_paid_online(pricing):
                continue

            description = f"Reservation unit {reservation_unit.pk} '{reservation_unit.name}', pricing {pricing.pk}"
            if accounting is None:
                errors.append(f"{description}: no payment accounting.")
                continue

            source = SalesItemSource(
                material=accounting.product_invoicing_material,
                main_ledger_account=accounting.main_ledger_account,
                tax_level_id=pricing.tax_level_id,
                description=f"{description}, payment accounting {accounting.pk} '{accounting.name}'",
            )
            if source.material:
                sources_by_material.setdefault(source.material, []).append(source)
            else:
                key = (source.tax_level_id, source.main_ledger_account)
                sources_without_material.setdefault(key, []).append(source)

    existing_sales_items = list(SalesItem.objects.order_by("pk"))

    material_errors = _sales_item_material_errors(
        sources_by_material=sources_by_material,
        existing_sales_items=existing_sales_items,
    )
    errors.extend(material_errors)

    name_errors = _sales_item_name_errors(
        sources_without_material=sources_without_material,
        existing_sales_items=existing_sales_items,
    )
    errors.extend(name_errors)

    has_units_without_pricings = any(
        reservation_unit.pk not in pricings_by_unit for reservation_unit in reservation_units
    )
    if has_units_without_pricings and not TaxLevel.objects.filter(name=FREE_PRICE_TAX_LEVEL_NAME).exists():
        errors.append(
            f"Tax level '{FREE_PRICE_TAX_LEVEL_NAME}' for the reservation units without pricings does not exist."
        )

    return errors


def _sales_item_material_errors(
    *,
    sources_by_material: dict[str, list[SalesItemSource]],
    existing_sales_items: list[SalesItem],
) -> list[str]:
    """Errors for the materials that have more than one tax level or main ledger account."""
    existing_by_material = {
        sales_item.material: sales_item for sales_item in existing_sales_items if sales_item.material
    }

    errors: list[str] = []
    for material, sources in sorted(sources_by_material.items()):
        values = {(source.tax_level_id, source.main_ledger_account) for source in sources}
        existing = existing_by_material.get(material)
        if existing is not None:
            values.add((existing.tax_level_id, existing.main_ledger_account))

        if len(values) > 1:
            source_texts = "\n    ".join(source.description for source in sources)
            value_texts = ", ".join(
                f"tax level {tax_level_id} with main ledger account {main_ledger_account}"
                for tax_level_id, main_ledger_account in sorted(values)
            )
            errors.append(
                f"Material {material} has more than one tax level or main ledger account: {value_texts}. "
                f"Used by:\n    {source_texts}"
            )

    return errors


def _sales_item_name_errors(
    *,
    sources_without_material: dict[tuple[int, str], list[SalesItemSource]],
    existing_sales_items: list[SalesItem],
) -> list[str]:
    """Errors for the new sales items without a material whose name another sales item already has."""
    existing_names = {sales_item.name for sales_item in existing_sales_items}
    existing_keys_without_material = {
        (sales_item.tax_level_id, sales_item.main_ledger_account)
        for sales_item in existing_sales_items
        if not sales_item.material
    }
    tax_level_names = dict(TaxLevel.objects.values_list("pk", "name"))

    errors: list[str] = []
    for key, sources in sorted(sources_without_material.items()):
        if key in existing_keys_without_material:
            continue

        tax_level_id, main_ledger_account = key
        name = f"{tax_level_names[tax_level_id]}, {main_ledger_account}"
        if name in existing_names:
            source_texts = "\n    ".join(source.description for source in sources)
            errors.append(
                f"A sales item without a material for tax level {tax_level_id} "
                f"with main ledger account {main_ledger_account} needs the name '{name}', "
                f"but another sales item has it. Used by:\n    {source_texts}"
            )

    return errors


def _price_line_errors() -> list[str]:
    """The same check as in the migration 0194."""
    tax_level_ids_by_percentage: dict[Decimal, set[int]] = {}
    for percentage, tax_level_id in TaxLevelRate.objects.values_list("percentage", "tax_level_id"):
        tax_level_ids_by_percentage.setdefault(percentage, set()).add(tax_level_id)

    used_percentages = set(Reservation.objects.values_list("tax_percentage_value", flat=True).distinct())
    unknown_percentages = sorted(
        percentage for percentage in used_percentages if len(tax_level_ids_by_percentage.get(percentage, set())) != 1
    )
    if unknown_percentages:
        return [f"No single tax level for the tax percentages of reservations: {unknown_percentages}"]

    return []


def _active_and_future_pricings(*, pricings: list[ReservationUnitPricing], today: datetime.date) -> list:
    past_or_active = [pricing for pricing in pricings if pricing.begins <= today]
    future = [pricing for pricing in pricings if pricing.begins > today]
    return past_or_active[-1:] + future


def _is_paid_online(pricing: ReservationUnitPricing) -> bool:
    return pricing.highest_price > Decimal(0) and pricing.payment_type in ONLINE_PAYMENT_TYPES
