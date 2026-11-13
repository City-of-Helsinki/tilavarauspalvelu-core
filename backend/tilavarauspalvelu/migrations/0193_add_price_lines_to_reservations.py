from __future__ import annotations

from decimal import Decimal

from django.db import migrations, models

BATCH_SIZE = 5_000


class PriceLineMigrationError(Exception):
    pass


def add_price_lines_to_reservations(apps, schema_editor):
    """
    Give each reservation that has no price lines one fixed price line from its saved price.
    The price unit and the pricing of the reservation are not known reliably, because the pricing could change
    after the reservation was made. The tax level comes from the tax percentage that the reservation saved.
    """
    Reservation = apps.get_model("tilavarauspalvelu", "Reservation")
    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")

    tax_level_ids_by_percentage: dict[Decimal, set[int]] = {}
    for percentage, tax_level_id in TaxLevelRate.objects.values_list("percentage", "tax_level_id"):
        tax_level_ids_by_percentage.setdefault(percentage, set()).add(tax_level_id)

    reservations = Reservation.objects.exclude(
        models.Exists(ReservationPriceLine.objects.filter(reservation=models.OuterRef("pk"))),
    )

    used_percentages = set(reservations.values_list("tax_percentage_value", flat=True).distinct())
    unknown_percentages = sorted(
        percentage for percentage in used_percentages if len(tax_level_ids_by_percentage.get(percentage, set())) != 1
    )
    if unknown_percentages:
        msg = f"No single tax level for the tax percentages of reservations: {unknown_percentages}"
        raise PriceLineMigrationError(msg)

    # Some old reservations have no saved price before subsidy. Their price is the price before subsidy.
    reservations.filter(price__gt=models.F("non_subsidised_price")).update(non_subsidised_price=models.F("price"))

    rows = (
        reservations
        .order_by("pk")
        .values_list("pk", "price", "non_subsidised_price", "tax_percentage_value")
        .iterator(chunk_size=BATCH_SIZE)
    )

    price_lines: list = []
    for reservation_id, price, non_subsidised_price, tax_percentage in rows:
        (tax_level_id,) = tax_level_ids_by_percentage[tax_percentage]

        price_line = ReservationPriceLine(
            reservation_id=reservation_id,
            price_component=None,
            description="",
            description_fi="",
            description_en="",
            description_sv="",
            quantity=Decimal(1),
            price_unit="FIXED",
            unit_amount=non_subsidised_price,
            amount_before_adjustment=non_subsidised_price,
            adjustment_percentage=Decimal(0),
            amount=non_subsidised_price,
            override_amount=price if price < non_subsidised_price else None,
            sales_item=None,
            tax_level_id=tax_level_id,
            tax_percentage=tax_percentage,
            vat_code="",
            payment_product=None,
        )
        price_lines.append(price_line)

        if len(price_lines) >= BATCH_SIZE:
            ReservationPriceLine.objects.bulk_create(price_lines)
            price_lines = []

    ReservationPriceLine.objects.bulk_create(price_lines)


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0192_migrate_pricings_to_pricing_groups"),
    ]

    operations = [
        # The reverse keeps the price lines, because the previous migration state can also have them.
        # Running the migration again skips the reservations that already have price lines.
        migrations.RunPython(
            code=add_price_lines_to_reservations,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
