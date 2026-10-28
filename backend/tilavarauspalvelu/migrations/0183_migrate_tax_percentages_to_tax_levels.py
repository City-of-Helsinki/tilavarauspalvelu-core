from __future__ import annotations

import datetime
from decimal import Decimal

from django.db import migrations


class TaxLevelMigrationError(Exception):
    pass


def migrate_tax_percentages_to_tax_levels(apps, schema_editor):
    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    # A new database gets its tax levels from the data creation commands.
    if not ReservationUnitPricing.objects.exists():
        return

    general_tax_level, _ = TaxLevel.objects.get_or_create(
        name="Yleinen",
        defaults={
            "name_fi": "Yleinen",
            "name_en": "General",
            "name_sv": "Allmän",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=general_tax_level,
        begins=datetime.date(2000, 1, 1),
        defaults={"percentage": Decimal("24.00")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=general_tax_level,
        begins=datetime.date(2024, 9, 1),
        defaults={"percentage": Decimal("25.50")},
    )

    reduced_tax_level, _ = TaxLevel.objects.get_or_create(
        name="Alennettu",
        defaults={
            "name_fi": "Alennettu",
            "name_en": "Reduced",
            "name_sv": "Reducerad",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=reduced_tax_level,
        begins=datetime.date(2000, 1, 1),
        defaults={"percentage": Decimal("10.00")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=reduced_tax_level,
        begins=datetime.date(2025, 1, 1),
        defaults={"percentage": Decimal("14.00")},
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=reduced_tax_level,
        begins=datetime.date(2026, 1, 1),
        defaults={"percentage": Decimal("13.50")},
    )

    tax_free_tax_level, _ = TaxLevel.objects.get_or_create(
        name="Veroton",
        defaults={
            "name_fi": "Veroton",
            "name_en": "Tax free",
            "name_sv": "Skattefri",
        },
    )
    TaxLevelRate.objects.get_or_create(
        tax_level=tax_free_tax_level,
        begins=datetime.date(2000, 1, 1),
        defaults={"percentage": Decimal("0.00")},
    )

    # Varaamo sells no food, so a 14 % pricing from before 2025 also belongs to the reduced level.
    tax_level_by_percentage = {
        Decimal("0.00"): tax_free_tax_level,
        Decimal("10.00"): reduced_tax_level,
        Decimal("14.00"): reduced_tax_level,
        Decimal("13.50"): reduced_tax_level,
        Decimal("24.00"): general_tax_level,
        Decimal("25.50"): general_tax_level,
    }

    unknown_percentages = list(
        ReservationUnitPricing.objects
        .exclude(tax_percentage__value__in=tax_level_by_percentage)
        .values_list("tax_percentage__value", flat=True)
        .distinct()
    )
    if unknown_percentages:
        msg = f"No tax level for the tax percentages: {unknown_percentages}"
        raise TaxLevelMigrationError(msg)

    vat_only_pricing_ids: list[int] = []
    previous_pricing = None

    pricings = ReservationUnitPricing.objects.select_related("tax_percentage").order_by(
        "reservation_unit_id",
        "begins",
        "pk",
    )

    for pricing in pricings:
        is_vat_only_change = (
            previous_pricing is not None
            and pricing.is_activated_on_begins
            and pricing.reservation_unit_id == previous_pricing.reservation_unit_id
            and (
                tax_level_by_percentage[pricing.tax_percentage.value]
                == tax_level_by_percentage[previous_pricing.tax_percentage.value]
            )
            and pricing.lowest_price == previous_pricing.lowest_price
            and pricing.highest_price == previous_pricing.highest_price
            and pricing.price_unit == previous_pricing.price_unit
            and pricing.payment_type == previous_pricing.payment_type
            and pricing.material_price_description_fi == previous_pricing.material_price_description_fi
            and pricing.material_price_description_en == previous_pricing.material_price_description_en
            and pricing.material_price_description_sv == previous_pricing.material_price_description_sv
        )
        if is_vat_only_change:
            vat_only_pricing_ids.append(pricing.pk)

        previous_pricing = pricing

    ReservationUnitPricing.objects.filter(pk__in=vat_only_pricing_ids).delete()

    for percentage, tax_level in tax_level_by_percentage.items():
        ReservationUnitPricing.objects.filter(tax_percentage__value=percentage).update(tax_level=tax_level)


def fill_missing_tax_percentages(apps, schema_editor):
    TaxPercentage = apps.get_model("tilavarauspalvelu", "TaxPercentage")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    for pricing in ReservationUnitPricing.objects.filter(tax_percentage__isnull=True):
        rates = TaxLevelRate.objects.filter(tax_level_id=pricing.tax_level_id).order_by("begins")
        rate = rates.filter(begins__lte=pricing.begins).last() or rates.first()
        if rate is None:
            msg = f"Tax level {pricing.tax_level_id} of pricing {pricing.pk} has no rates"
            raise TaxLevelMigrationError(msg)

        tax_percentage = TaxPercentage.objects.filter(value=rate.percentage).first()
        if tax_percentage is None:
            tax_percentage = TaxPercentage.objects.create(value=rate.percentage)

        pricing.tax_percentage = tax_percentage
        pricing.save(update_fields=["tax_percentage"])


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0182_add_tax_level_to_reservation_unit_pricing"),
    ]

    operations = [
        migrations.RunPython(
            code=migrate_tax_percentages_to_tax_levels,
            reverse_code=fill_missing_tax_percentages,
        ),
    ]
