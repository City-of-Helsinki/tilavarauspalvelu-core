from __future__ import annotations

import dataclasses
import datetime
from decimal import Decimal

from django.db import migrations

from utils.date_utils import local_date

ONLINE_PAYMENT_TYPES = {"ONLINE", "ONLINE_OR_INVOICE"}

# A reservation unit without pricings gets a free price from this date, so that it covers all its reservations.
FREE_PRICE_BEGINS = datetime.date(2000, 1, 1)
FREE_PRICE_TAX_LEVEL_NAME = "Veroton"


class PricingMigrationError(Exception):
    pass


@dataclasses.dataclass(frozen=True, slots=True)
class SalesItemSource:
    """A material that an active or future pricing paid online uses, and where it was found."""

    material: str
    main_ledger_account: str
    tax_level_id: int
    description: str


def migrate_pricings_to_pricing_groups(apps, schema_editor):
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    ReservationUnitPricingGroup = apps.get_model("tilavarauspalvelu", "ReservationUnitPricingGroup")
    PricingGroup = apps.get_model("tilavarauspalvelu", "PricingGroup")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")

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

    pricings_by_unit: dict[int, list] = {}
    pricings = ReservationUnitPricing.objects.filter(reservation_unit__in=reservation_units).order_by("begins")
    for pricing in pricings:
        pricings_by_unit.setdefault(pricing.reservation_unit_id, []).append(pricing)

    errors: list[str] = []
    sources_by_material: dict[str, list[SalesItemSource]] = {}

    for reservation_unit in reservation_units:
        unit_pricings = pricings_by_unit.get(reservation_unit.pk, [])
        if unit_pricings and unit_pricings[0].begins > today:
            errors.append(
                f"Reservation unit {reservation_unit.pk} '{reservation_unit.name}' has no pricing today. "
                f"Its first pricing begins on {unit_pricings[0].begins.isoformat()}."
            )
            continue

        accounting = reservation_unit.payment_accounting
        if accounting is None and reservation_unit.unit is not None:
            accounting = reservation_unit.unit.payment_accounting

        for pricing in _active_and_future_pricings(pricings=unit_pricings, today=today):
            if not _is_paid_online(pricing):
                continue

            description = f"Reservation unit {reservation_unit.pk} '{reservation_unit.name}', pricing {pricing.pk}"
            if accounting is None:
                errors.append(f"{description}: no payment accounting.")
                continue

            if not accounting.product_invoicing_material:
                errors.append(f"{description}: payment accounting {accounting.pk} '{accounting.name}' has no material.")
                continue

            source = SalesItemSource(
                material=accounting.product_invoicing_material,
                main_ledger_account=accounting.main_ledger_account,
                tax_level_id=pricing.tax_level_id,
                description=f"{description}, payment accounting {accounting.pk} '{accounting.name}'",
            )
            sources_by_material.setdefault(source.material, []).append(source)

    existing_sales_items = {sales_item.material: sales_item for sales_item in SalesItem.objects.all()}

    for material, sources in sorted(sources_by_material.items()):
        values = {(source.tax_level_id, source.main_ledger_account) for source in sources}
        existing = existing_sales_items.get(material)
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

    if errors:
        error_texts = "\n- ".join(errors)
        msg = f"Cannot move the pricings to pricing groups:\n- {error_texts}"
        raise PricingMigrationError(msg)

    sales_items_by_material = dict(existing_sales_items)
    for material, sources in sorted(sources_by_material.items()):
        if material in sales_items_by_material:
            continue

        sales_items_by_material[material] = SalesItem.objects.create(
            name=material,
            material=material,
            main_ledger_account=sources[0].main_ledger_account,
            tax_level_id=sources[0].tax_level_id,
        )

    free_tax_level = None
    if any(reservation_unit.pk not in pricings_by_unit for reservation_unit in reservation_units):
        free_tax_level = TaxLevel.objects.filter(name=FREE_PRICE_TAX_LEVEL_NAME).first()
        if free_tax_level is None:
            msg = f"Tax level '{FREE_PRICE_TAX_LEVEL_NAME}' for the reservation units without pricings does not exist."
            raise PricingMigrationError(msg)

    components: list = []
    changed_reservation_units: list = []

    for reservation_unit in reservation_units:
        unit_pricings = pricings_by_unit.get(reservation_unit.pk, [])

        if not unit_pricings:
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
                begins=FREE_PRICE_BEGINS,
            )
            component = PriceComponent(
                pricing_group=pricing_group,
                kind="BASE",
                valid_from=FREE_PRICE_BEGINS,
                valid_until=None,
                price_option=None,
                amount=Decimal(0),
                price_unit="FIXED",
                can_apply_for_discount=False,
                tax_level=free_tax_level,
                sales_item=None,
            )
            components.append(component)
            continue

        accounting = reservation_unit.payment_accounting
        if accounting is None and reservation_unit.unit is not None:
            accounting = reservation_unit.unit.payment_accounting

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
            begins=unit_pricings[0].begins,
        )

        valid_until_dates = [pricing.begins for pricing in unit_pricings[1:]] + [None]
        for pricing, valid_until in zip(unit_pricings, valid_until_dates, strict=True):
            # A past pricing gets a sales item only if its material has one with the same tax level.
            sales_item = None
            if _is_paid_online(pricing) and accounting is not None:
                sales_item = sales_items_by_material.get(accounting.product_invoicing_material)
                if sales_item is not None and sales_item.tax_level_id != pricing.tax_level_id:
                    sales_item = None

            component = PriceComponent(
                pricing_group=pricing_group,
                kind="BASE",
                valid_from=pricing.begins,
                valid_until=valid_until,
                price_option=None,
                amount=pricing.highest_price,
                price_unit=pricing.price_unit,
                can_apply_for_discount=reservation_unit.can_apply_free_of_charge and pricing.highest_price > 0,
                material_price_description=pricing.material_price_description,
                material_price_description_fi=pricing.material_price_description_fi,
                material_price_description_en=pricing.material_price_description_en,
                material_price_description_sv=pricing.material_price_description_sv,
                tax_level_id=pricing.tax_level_id,
                sales_item=sales_item,
            )
            components.append(component)

        payment_type = _payment_type(pricings=unit_pricings, today=today)
        if payment_type is not None:
            reservation_unit.payment_type = payment_type
            changed_reservation_units.append(reservation_unit)

    PriceComponent.objects.bulk_create(components)
    ReservationUnit.objects.bulk_update(changed_reservation_units, fields=["payment_type"])


# Internals


def _active_and_future_pricings(*, pricings: list, today: datetime.date) -> list:
    past_or_active = [pricing for pricing in pricings if pricing.begins <= today]
    future = [pricing for pricing in pricings if pricing.begins > today]
    return past_or_active[-1:] + future


def _is_paid_online(pricing) -> bool:
    return pricing.highest_price > Decimal(0) and pricing.payment_type in ONLINE_PAYMENT_TYPES


def _payment_type(*, pricings: list, today: datetime.date) -> str | None:
    """The payment type of the first paid pricing from the active one onward."""
    for pricing in _active_and_future_pricings(pricings=pricings, today=today):
        if pricing.highest_price > Decimal(0) and pricing.payment_type is not None:
            return pricing.payment_type
    return None


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0190_add_price_option_to_reservation"),
    ]

    operations = [
        # The old pricings are not changed, so the reverse does nothing.
        # Running the migration again skips the reservation units that already have a pricing group.
        migrations.RunPython(
            code=migrate_pricings_to_pricing_groups,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
