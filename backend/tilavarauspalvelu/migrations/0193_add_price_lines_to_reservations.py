from __future__ import annotations

from decimal import Decimal

from django.db import migrations, models
from django.db.models.functions import Coalesce, Round

from utils.decimal_utils import round_decimal

BATCH_SIZE = 5_000


class PriceLineMigrationError(Exception):
    pass


def add_price_lines_to_reservations(apps, schema_editor):
    """
    Give each reservation that has no price lines one fixed price line from its saved price,
    and set the totals of every reservation from its price lines.
    The price unit and the pricing of the reservation are not known reliably, because the pricing could change
    after the reservation was made. The tax level comes from the tax percentage that the reservation saved.
    """
    Reservation = apps.get_model("tilavarauspalvelu", "Reservation")
    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")

    tax_level_ids_by_percentage: dict[Decimal, set[int]] = {}
    for percentage, tax_level_id in TaxLevelRate.objects.values_list("percentage", "tax_level_id"):
        tax_level_ids_by_percentage.setdefault(percentage, set()).add(tax_level_id)

    has_price_lines = models.Exists(ReservationPriceLine.objects.filter(reservation=models.OuterRef("pk")))
    reservation_pks_with_price_lines = list(Reservation.objects.filter(has_price_lines).values_list("pk", flat=True))
    reservations = Reservation.objects.exclude(has_price_lines)

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
    reservations_with_totals: list = []
    for reservation_id, price, non_subsidised_price, tax_percentage in rows:
        (tax_level_id,) = tax_level_ids_by_percentage[tax_percentage]
        final_amount = min(price, non_subsidised_price)

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

        reservation = Reservation(
            pk=reservation_id,
            total_price=final_amount,
            total_price_without_overrides=non_subsidised_price,
            total_price_net=round_decimal(final_amount / (1 + tax_percentage / Decimal(100)), 2),
        )
        reservations_with_totals.append(reservation)

        if len(price_lines) >= BATCH_SIZE:
            save_batch(
                Reservation=Reservation,
                ReservationPriceLine=ReservationPriceLine,
                price_lines=price_lines,
                reservations=reservations_with_totals,
            )
            price_lines = []
            reservations_with_totals = []

    save_batch(
        Reservation=Reservation,
        ReservationPriceLine=ReservationPriceLine,
        price_lines=price_lines,
        reservations=reservations_with_totals,
    )

    # Reservations that already had price lines, such as seasonal ones, get their totals from their lines.
    set_reservation_totals_from_lines(
        Reservation=Reservation,
        ReservationPriceLine=ReservationPriceLine,
        reservation_pks=reservation_pks_with_price_lines,
    )


def save_batch(*, Reservation, ReservationPriceLine, price_lines: list, reservations: list) -> None:  # noqa: N803
    ReservationPriceLine.objects.bulk_create(price_lines)
    Reservation.objects.bulk_update(
        reservations,
        fields=["total_price", "total_price_without_overrides", "total_price_net"],
    )


def set_reservation_totals_from_lines(*, Reservation, ReservationPriceLine, reservation_pks: list[int]) -> None:  # noqa: N803
    """Set the totals of the given reservations from their price lines, with one update."""
    final_amount = Coalesce("override_amount", "amount")
    net_amount = Round(final_amount / (Decimal(1) + models.F("tax_percentage") / Decimal(100)), 2)

    def line_sum(expression):
        lines = (
            ReservationPriceLine.objects
            .filter(reservation=models.OuterRef("pk"))
            .values("reservation")
            .annotate(total=models.Sum(expression, output_field=models.DecimalField()))
            .values("total")[:1]
        )
        return Coalesce(models.Subquery(lines), Decimal(0), output_field=models.DecimalField())

    Reservation.objects.filter(pk__in=reservation_pks).update(
        total_price=line_sum(final_amount),
        total_price_without_overrides=line_sum(models.F("amount")),
        total_price_net=line_sum(net_amount),
    )


class Migration(migrations.Migration):
    dependencies = [
        ("tilavarauspalvelu", "0192_add_reservation_totals"),
    ]

    operations = [
        # The reverse keeps the price lines, because the previous migration state can also have them.
        # Running the migration again skips the reservations that already have price lines.
        migrations.RunPython(
            code=add_price_lines_to_reservations,
            reverse_code=migrations.RunPython.noop,
        ),
    ]
