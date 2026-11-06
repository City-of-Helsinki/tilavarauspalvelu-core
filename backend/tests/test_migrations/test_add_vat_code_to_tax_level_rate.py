from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

if TYPE_CHECKING:
    from django.db.migrations.state import StateApps

BEFORE_MIGRATION = ("tilavarauspalvelu", "0188_add_sales_items")
AFTER_MIGRATION = ("tilavarauspalvelu", "0189_add_vat_code_to_tax_level_rate")

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


# ── Forward ──


def test_add_vat_code_to_tax_level_rate__fills_vat_code_by_percentage():
    apps = migrate_to(BEFORE_MIGRATION)

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

    apps = migrate_to(AFTER_MIGRATION)

    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")
    rates = TaxLevelRate.objects.order_by("tax_level", "begins")
    assert list(rates.values_list("tax_level__name", "percentage", "vat_code")) == [
        ("Yleinen", Decimal("24.00"), ""),
        ("Yleinen", Decimal("25.50"), "48"),
        ("Alennettu", Decimal("10.00"), ""),
        ("Alennettu", Decimal("14.00"), ""),
        ("Alennettu", Decimal("13.50"), "47"),
        ("Veroton", Decimal("0.00"), "4U"),
    ]
