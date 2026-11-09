from __future__ import annotations

import datetime
import importlib
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from tests.factories import ReservationFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from django.db.migrations.state import StateApps

migration = importlib.import_module("tilavarauspalvelu.migrations.0192_add_price_lines_to_reservations")

BEFORE_MIGRATION = ("tilavarauspalvelu", "0191_migrate_pricings_to_pricing_groups")
AFTER_MIGRATION = ("tilavarauspalvelu", "0192_add_price_lines_to_reservations")

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def migrate_to(target: tuple[str, str]) -> StateApps:
    """Migrate the database to the given migration and return the models of that state."""
    # A schema change fails while the test transaction has pending checks for foreign keys.
    with connection.cursor() as cursor:
        cursor.execute("SET CONSTRAINTS ALL IMMEDIATE")

    executor = MigrationExecutor(connection)
    executor.migrate([target])
    executor.loader.build_graph()
    return executor.loader.project_state([target]).apps


def create_tax_levels(apps: StateApps) -> None:
    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")

    general = TaxLevel.objects.create(name="Yleinen")
    reduced = TaxLevel.objects.create(name="Alennettu")
    tax_free = TaxLevel.objects.create(name="Veroton")

    TaxLevelRate.objects.bulk_create([
        TaxLevelRate(tax_level=general, begins=datetime.date(2000, 1, 1), percentage=Decimal("24.00")),
        TaxLevelRate(tax_level=general, begins=datetime.date(2024, 9, 1), percentage=Decimal("25.50")),
        TaxLevelRate(tax_level=reduced, begins=datetime.date(2000, 1, 1), percentage=Decimal("10.00")),
        TaxLevelRate(tax_level=reduced, begins=datetime.date(2025, 1, 1), percentage=Decimal("14.00")),
        TaxLevelRate(tax_level=reduced, begins=datetime.date(2026, 1, 1), percentage=Decimal("13.50")),
        TaxLevelRate(tax_level=tax_free, begins=datetime.date(2000, 1, 1), percentage=Decimal("0.00")),
    ])


def price_lines_of(apps: StateApps, reservation_pk: int) -> list[tuple[Any, ...]]:
    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    price_lines = ReservationPriceLine.objects.filter(reservation=reservation_pk).values_list(
        "price_component",
        "description_fi",
        "quantity",
        "price_unit",
        "unit_amount",
        "amount_before_adjustment",
        "adjustment_percentage",
        "amount",
        "override_amount",
        "sales_item",
        "tax_level__name",
        "tax_percentage",
        "vat_code",
        "payment_product",
    )
    return list(price_lines)


# ── Price lines ──


def test_add_price_lines_to_reservations__line_from_price():
    reservation = ReservationFactory.create(
        price=Decimal("50.00"),
        non_subsidised_price=Decimal("50.00"),
        tax_percentage_value=Decimal("25.50"),
    )

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    apps = migrate_to(AFTER_MIGRATION)

    assert price_lines_of(apps, reservation.pk) == [
        (
            None,
            "",
            Decimal(1),
            "FIXED",
            Decimal("50.00"),
            Decimal("50.00"),
            Decimal(0),
            Decimal("50.00"),
            None,
            None,
            "Yleinen",
            Decimal("25.50"),
            "",
            None,
        ),
    ]


def test_add_price_lines_to_reservations__override_when_subsidised():
    reservation = ReservationFactory.create(
        price=Decimal("10.00"),
        non_subsidised_price=Decimal("50.00"),
        tax_percentage_value=Decimal("13.50"),
    )

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    apps = migrate_to(AFTER_MIGRATION)

    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    price_lines = ReservationPriceLine.objects.filter(reservation=reservation.pk)
    assert list(price_lines.values_list("amount", "override_amount", "tax_level__name")) == [
        (Decimal("50.00"), Decimal("10.00"), "Alennettu"),
    ]


def test_add_price_lines_to_reservations__free():
    reservation = ReservationFactory.create(
        price=Decimal(0),
        non_subsidised_price=Decimal(0),
        tax_percentage_value=Decimal(0),
    )

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    apps = migrate_to(AFTER_MIGRATION)

    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    price_lines = ReservationPriceLine.objects.filter(reservation=reservation.pk)
    assert list(price_lines.values_list("amount", "override_amount", "tax_level__name")) == [
        (Decimal(0), None, "Veroton"),
    ]


def test_add_price_lines_to_reservations__price_above_non_subsidised_price():
    reservation = ReservationFactory.create(
        price=Decimal("120.00"),
        non_subsidised_price=Decimal(0),
        tax_percentage_value=Decimal("24.00"),
    )

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    apps = migrate_to(AFTER_MIGRATION)

    Reservation = apps.get_model("tilavarauspalvelu", "Reservation")
    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")

    reservations = Reservation.objects.filter(pk=reservation.pk)
    assert list(reservations.values_list("price", "non_subsidised_price")) == [
        (Decimal("120.00"), Decimal("120.00")),
    ]

    price_lines = ReservationPriceLine.objects.filter(reservation=reservation.pk)
    assert list(price_lines.values_list("amount", "override_amount")) == [(Decimal("120.00"), None)]


def test_add_price_lines_to_reservations__skips_reservation_with_price_lines():
    reservation = ReservationFactory.create(
        price=Decimal("50.00"),
        non_subsidised_price=Decimal("50.00"),
        tax_percentage_value=Decimal("25.50"),
    )

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    ReservationPriceLine.objects.create(
        reservation_id=reservation.pk,
        quantity=Decimal(2),
        price_unit="PER_HOUR",
        unit_amount=Decimal("25.00"),
        amount_before_adjustment=Decimal("50.00"),
        amount=Decimal("50.00"),
        tax_level=TaxLevel.objects.get(name="Yleinen"),
        tax_percentage=Decimal("25.50"),
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationPriceLine = apps.get_model("tilavarauspalvelu", "ReservationPriceLine")
    price_lines = ReservationPriceLine.objects.filter(reservation=reservation.pk)
    assert list(price_lines.values_list("quantity", "price_unit")) == [(Decimal(2), "PER_HOUR")]


# ── Errors ──


def test_add_price_lines_to_reservations__error_when_unknown_tax_percentage():
    ReservationFactory.create(tax_percentage_value=Decimal("23.00"))

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    msg = "No single tax level for the tax percentages of reservations: [Decimal('23.00')]"
    with pytest.raises(migration.PriceLineMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


def test_add_price_lines_to_reservations__error_when_tax_percentage_has_two_tax_levels():
    ReservationFactory.create(tax_percentage_value=Decimal("25.50"))

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_levels(apps)

    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")
    other = TaxLevel.objects.create(name="Muu")
    TaxLevelRate.objects.create(tax_level=other, begins=datetime.date(2000, 1, 1), percentage=Decimal("25.50"))

    msg = "No single tax level for the tax percentages of reservations: [Decimal('25.50')]"
    with pytest.raises(migration.PriceLineMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)
