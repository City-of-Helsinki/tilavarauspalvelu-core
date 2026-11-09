from __future__ import annotations

import os
from decimal import Decimal
from typing import TYPE_CHECKING, Any

from django.core.management import BaseCommand, CommandError, call_command
from django.db import transaction

from tilavarauspalvelu.models import (
    PaymentAccounting,
    ReservationUnit,
    ReservationUnitPricing,
    ReservationUnitPricingGroup,
    SalesItem,
)
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import TaxLevel

ONLINE_PAYMENT_TYPES = {"ONLINE", "ONLINE_OR_INVOICE"}

# Made-up SAP materials start with these digits, so that they are easy to find in the test data.
TEST_MATERIAL_PREFIX = "99"


class Command(BaseCommand):
    help = (
        "Fixes the accounting data that stops the migration 0191 (TILA-4545) in a test environment, "
        "so that online payment keeps working. Units without an accounting get a test accounting, "
        "and accountings without a material, or with a material of another tax level, get a made-up material. "
        "Then runs 'check_pricing_migration_conflicts'. Never run in production."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        if os.getenv("DJANGO_SETTINGS_ENVIRONMENT") == "Production":
            msg = "This command makes up accounting data, so it cannot run in production."
            raise CommandError(msg)

        with transaction.atomic():
            changes = _fix_accountings()

        for change in changes:
            self.stdout.write(change)
        self.stdout.write(f"Made {len(changes)} changes.")

        call_command("check_pricing_migration_conflicts", stdout=self.stdout, stderr=self.stderr)


# Internals


def _fix_accountings() -> list[str]:
    """
    Give every reservation unit that is paid online today or later an accounting with a material,
    so that each material has one tax level and one main ledger account.
    A reservation unit with online pricings of more than one tax level is left as it is.
    """
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
    pricings = (
        ReservationUnitPricing.objects
        .filter(reservation_unit__in=reservation_units)
        .select_related("tax_level")
        .order_by("begins")
    )
    for pricing in pricings:
        pricings_by_unit.setdefault(pricing.reservation_unit_id, []).append(pricing)

    # The tax level and main ledger account that each material already has.
    material_owners: dict[str, tuple[int, str]] = {
        sales_item.material: (sales_item.tax_level_id, sales_item.main_ledger_account)
        for sales_item in SalesItem.objects.all()
    }
    used_materials = set(material_owners)
    used_materials.update(
        PaymentAccounting.objects.exclude(product_invoicing_material="").values_list(
            "product_invoicing_material",
            flat=True,
        )
    )

    test_accountings: dict[int, PaymentAccounting] = {}
    accounting_copies: dict[tuple[int, int], PaymentAccounting] = {}
    changes: list[str] = []

    for reservation_unit in reservation_units:
        unit_pricings = pricings_by_unit.get(reservation_unit.pk, [])
        tax_level = _single_online_tax_level(pricings=unit_pricings, today=today)
        if tax_level is None:
            continue

        description = f"Reservation unit {reservation_unit.pk} '{reservation_unit.name}'"

        accounting: PaymentAccounting | None = reservation_unit.payment_accounting
        if accounting is None and reservation_unit.unit is not None:
            accounting = reservation_unit.unit.payment_accounting

        if accounting is None:
            if tax_level.pk not in test_accountings:
                material = _next_test_material(used_materials=used_materials)
                test_accountings[tax_level.pk] = _create_test_accounting(tax_level=tax_level, material=material)
                material_owners[material] = (tax_level.pk, test_accountings[tax_level.pk].main_ledger_account)

            accounting = test_accountings[tax_level.pk]
            reservation_unit.payment_accounting = accounting
            reservation_unit.save(update_fields=["payment_accounting"])
            changes.append(f"{description}: uses the test accounting {accounting.pk} '{accounting.name}'.")
            continue

        if not accounting.product_invoicing_material:
            material = _next_test_material(used_materials=used_materials)
            _set_material(accounting=accounting, material=material)
            material_owners[material] = (tax_level.pk, accounting.main_ledger_account)
            changes.append(f"Payment accounting {accounting.pk} '{accounting.name}': has the material {material}.")
            continue

        owner = material_owners.setdefault(
            accounting.product_invoicing_material,
            (tax_level.pk, accounting.main_ledger_account),
        )
        if owner == (tax_level.pk, accounting.main_ledger_account):
            continue

        key = (accounting.pk, tax_level.pk)
        if key not in accounting_copies:
            material = _next_test_material(used_materials=used_materials)
            accounting_copies[key] = _copy_accounting(accounting=accounting, tax_level=tax_level, material=material)
            material_owners[material] = (tax_level.pk, accounting.main_ledger_account)

        copy = accounting_copies[key]
        reservation_unit.payment_accounting = copy
        reservation_unit.save(update_fields=["payment_accounting"])
        changes.append(
            f"{description}: uses the accounting {copy.pk} '{copy.name}' with the material of its tax level."
        )

    return changes


def _single_online_tax_level(*, pricings: list[ReservationUnitPricing], today: datetime.date) -> TaxLevel | None:
    """
    The tax level of the online pricings that are active or in the future, if they all have the same one.
    None if there are none, if they have many, or if the first pricing begins in the future.
    """
    if pricings and pricings[0].begins > today:
        return None

    online_pricings = [
        pricing
        for pricing in _active_and_future_pricings(pricings=pricings, today=today)
        if pricing.highest_price > Decimal(0) and pricing.payment_type in ONLINE_PAYMENT_TYPES
    ]
    tax_levels = {pricing.tax_level_id: pricing.tax_level for pricing in online_pricings}
    if len(tax_levels) != 1:
        return None

    return next(iter(tax_levels.values()))


def _active_and_future_pricings(*, pricings: list[ReservationUnitPricing], today: datetime.date) -> list:
    past_or_active = [pricing for pricing in pricings if pricing.begins <= today]
    future = [pricing for pricing in pricings if pricing.begins > today]
    return past_or_active[-1:] + future


def _next_test_material(*, used_materials: set[str]) -> str:
    number = 0
    while True:
        material = f"{TEST_MATERIAL_PREFIX}{number:06d}"
        if material not in used_materials:
            used_materials.add(material)
            return material
        number += 1


def _set_material(*, accounting: PaymentAccounting, material: str) -> None:
    # The product invoicing fields must all be set or all be empty.
    accounting.product_invoicing_material = material
    accounting.product_invoicing_sales_org = accounting.product_invoicing_sales_org or "2900"
    accounting.product_invoicing_sales_office = accounting.product_invoicing_sales_office or "2911"
    accounting.product_invoicing_order_type = accounting.product_invoicing_order_type or "ZTY1"
    accounting.save(
        update_fields=[
            "product_invoicing_material",
            "product_invoicing_sales_org",
            "product_invoicing_sales_office",
            "product_invoicing_order_type",
        ]
    )


def _create_test_accounting(*, tax_level: TaxLevel, material: str) -> PaymentAccounting:
    return PaymentAccounting.objects.create(
        name=f"Testitiliöinti, {tax_level.name}",
        company_code="2800",
        main_ledger_account="340025",
        vat_code="44",
        internal_order="2984300100",
        project="",
        operation_area="",
        balance_profit_center="2984300",
        product_invoicing_sales_org="2900",
        product_invoicing_sales_office="2911",
        product_invoicing_material=material,
        product_invoicing_order_type="ZTY1",
    )


def _copy_accounting(*, accounting: PaymentAccounting, tax_level: TaxLevel, material: str) -> PaymentAccounting:
    copy = PaymentAccounting.objects.get(pk=accounting.pk)
    copy.pk = None
    copy.name = f"{accounting.name}, {tax_level.name}"
    copy.product_invoicing_material = material
    copy.save()
    return copy
