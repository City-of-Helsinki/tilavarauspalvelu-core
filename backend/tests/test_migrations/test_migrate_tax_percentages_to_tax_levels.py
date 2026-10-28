from __future__ import annotations

import datetime
import importlib
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from tests.factories import ReservationUnitFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from django.db.migrations.state import StateApps

    from tilavarauspalvelu.models import ReservationUnit

migration = importlib.import_module("tilavarauspalvelu.migrations.0183_migrate_tax_percentages_to_tax_levels")

BEFORE_MIGRATION = ("tilavarauspalvelu", "0182_add_tax_level_to_reservation_unit_pricing")
AFTER_MIGRATION = ("tilavarauspalvelu", "0183_migrate_tax_percentages_to_tax_levels")

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def migrate_to(target: tuple[str, str]) -> StateApps:
    """Migrate the database to the given migration and return the models of that state."""
    executor = MigrationExecutor(connection)
    executor.migrate([target])
    executor.loader.build_graph()
    return executor.loader.project_state([target]).apps


def create_pricing(
    apps: StateApps,
    *,
    reservation_unit: ReservationUnit,
    percentage: Decimal,
    begins: datetime.date = datetime.date(2024, 1, 1),
    highest_price: Decimal = Decimal(10),
    is_activated_on_begins: bool = False,
) -> Any:
    TaxPercentage = apps.get_model("tilavarauspalvelu", "TaxPercentage")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    tax_percentage, _ = TaxPercentage.objects.get_or_create(value=percentage)
    return ReservationUnitPricing.objects.create(
        reservation_unit_id=reservation_unit.pk,
        begins=begins,
        lowest_price=Decimal(5),
        highest_price=highest_price,
        tax_percentage=tax_percentage,
        is_activated_on_begins=is_activated_on_begins,
    )


# ── Forward ──


def test_migrate_tax_percentages_to_tax_levels__creates_tax_levels_with_rate_history():
    apps = migrate_to(BEFORE_MIGRATION)
    create_pricing(apps, reservation_unit=ReservationUnitFactory.create(), percentage=Decimal("25.50"))

    apps = migrate_to(AFTER_MIGRATION)

    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")

    tax_levels = TaxLevel.objects.order_by("pk")
    assert list(tax_levels.values_list("name_fi", "name_en", "name_sv")) == [
        ("Yleinen", "General", "Allmän"),
        ("Alennettu", "Reduced", "Reducerad"),
        ("Veroton", "Tax free", "Skattefri"),
    ]

    rates = TaxLevelRate.objects.order_by("tax_level", "begins")
    assert list(rates.values_list("tax_level__name", "begins", "percentage")) == [
        ("Yleinen", datetime.date(2000, 1, 1), Decimal("24.00")),
        ("Yleinen", datetime.date(2024, 9, 1), Decimal("25.50")),
        ("Alennettu", datetime.date(2000, 1, 1), Decimal("10.00")),
        ("Alennettu", datetime.date(2025, 1, 1), Decimal("14.00")),
        ("Alennettu", datetime.date(2026, 1, 1), Decimal("13.50")),
        ("Veroton", datetime.date(2000, 1, 1), Decimal("0.00")),
    ]


def test_migrate_tax_percentages_to_tax_levels__no_pricings():
    migrate_to(BEFORE_MIGRATION)

    apps = migrate_to(AFTER_MIGRATION)

    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    assert TaxLevel.objects.exists() is False


@pytest.mark.parametrize(
    ("percentage", "tax_level_name"),
    [
        (Decimal("0.00"), "Veroton"),
        (Decimal("10.00"), "Alennettu"),
        (Decimal("14.00"), "Alennettu"),
        (Decimal("13.50"), "Alennettu"),
        (Decimal("24.00"), "Yleinen"),
        (Decimal("25.50"), "Yleinen"),
    ],
)
def test_migrate_tax_percentages_to_tax_levels__sets_tax_level_by_percentage(percentage, tax_level_name):
    apps = migrate_to(BEFORE_MIGRATION)
    pricing = create_pricing(apps, reservation_unit=ReservationUnitFactory.create(), percentage=percentage)

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    pricings = ReservationUnitPricing.objects.filter(pk=pricing.pk)
    assert list(pricings.values_list("tax_level__name", "tax_percentage__value")) == [(tax_level_name, percentage)]


def test_migrate_tax_percentages_to_tax_levels__unknown_percentage():
    apps = migrate_to(BEFORE_MIGRATION)
    create_pricing(apps, reservation_unit=ReservationUnitFactory.create(), percentage=Decimal("23.00"))

    msg = "No tax level for the tax percentages: [Decimal('23.00')]"
    with pytest.raises(migration.TaxLevelMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


# ── Forward: VAT only changes ──


def test_migrate_tax_percentages_to_tax_levels__deletes_vat_only_change():
    apps = migrate_to(BEFORE_MIGRATION)
    reservation_unit = ReservationUnitFactory.create()
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 1, 1),
        percentage=Decimal("10.00"),
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2025, 1, 1),
        percentage=Decimal("14.00"),
        is_activated_on_begins=True,
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2026, 1, 1),
        percentage=Decimal("13.50"),
        is_activated_on_begins=True,
        highest_price=Decimal(20),
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    pricings = ReservationUnitPricing.objects.filter(reservation_unit_id=reservation_unit.pk).order_by("begins")
    assert list(pricings.values_list("begins", "tax_level__name", "highest_price")) == [
        (datetime.date(2024, 1, 1), "Alennettu", Decimal(10)),
        (datetime.date(2026, 1, 1), "Alennettu", Decimal(20)),
    ]


def test_migrate_tax_percentages_to_tax_levels__keeps_vat_change_with_new_price():
    apps = migrate_to(BEFORE_MIGRATION)
    reservation_unit = ReservationUnitFactory.create()
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 1, 1),
        percentage=Decimal("24.00"),
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 9, 1),
        percentage=Decimal("25.50"),
        is_activated_on_begins=True,
        highest_price=Decimal("10.12"),
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    pricings = ReservationUnitPricing.objects.filter(reservation_unit_id=reservation_unit.pk).order_by("begins")
    assert list(pricings.values_list("begins", "highest_price")) == [
        (datetime.date(2024, 1, 1), Decimal(10)),
        (datetime.date(2024, 9, 1), Decimal("10.12")),
    ]


def test_migrate_tax_percentages_to_tax_levels__keeps_change_to_another_tax_level():
    apps = migrate_to(BEFORE_MIGRATION)
    reservation_unit = ReservationUnitFactory.create()
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 1, 1),
        percentage=Decimal("10.00"),
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 9, 1),
        percentage=Decimal("25.50"),
        is_activated_on_begins=True,
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    pricings = ReservationUnitPricing.objects.filter(reservation_unit_id=reservation_unit.pk).order_by("begins")
    assert list(pricings.values_list("begins", "tax_level__name")) == [
        (datetime.date(2024, 1, 1), "Alennettu"),
        (datetime.date(2024, 9, 1), "Yleinen"),
    ]


def test_migrate_tax_percentages_to_tax_levels__keeps_same_price_without_activation_flag():
    apps = migrate_to(BEFORE_MIGRATION)
    reservation_unit = ReservationUnitFactory.create()
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 1, 1),
        percentage=Decimal("24.00"),
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        begins=datetime.date(2024, 9, 1),
        percentage=Decimal("25.50"),
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    pricings = ReservationUnitPricing.objects.filter(reservation_unit_id=reservation_unit.pk).order_by("begins")
    assert list(pricings.values_list("begins", flat=True)) == [
        datetime.date(2024, 1, 1),
        datetime.date(2024, 9, 1),
    ]


def test_migrate_tax_percentages_to_tax_levels__keeps_same_price_in_another_reservation_unit():
    apps = migrate_to(BEFORE_MIGRATION)
    create_pricing(
        apps,
        reservation_unit=ReservationUnitFactory.create(),
        begins=datetime.date(2024, 1, 1),
        percentage=Decimal("24.00"),
    )
    pricing = create_pricing(
        apps,
        reservation_unit=ReservationUnitFactory.create(),
        begins=datetime.date(2024, 9, 1),
        percentage=Decimal("25.50"),
        is_activated_on_begins=True,
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")
    assert ReservationUnitPricing.objects.filter(pk=pricing.pk).exists() is True


# ── Reverse ──


def test_fill_missing_tax_percentages():
    apps = migrate_to(AFTER_MIGRATION)

    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")
    TaxPercentage = apps.get_model("tilavarauspalvelu", "TaxPercentage")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    tax_level = TaxLevel.objects.create(name="Yleinen")
    TaxLevelRate.objects.create(tax_level=tax_level, begins=datetime.date(2020, 1, 1), percentage=Decimal("24.00"))
    TaxLevelRate.objects.create(tax_level=tax_level, begins=datetime.date(2024, 9, 1), percentage=Decimal("25.50"))

    reservation_unit = ReservationUnitFactory.create()
    for begins in (datetime.date(2019, 1, 1), datetime.date(2024, 8, 31), datetime.date(2024, 9, 1)):
        ReservationUnitPricing.objects.create(
            reservation_unit_id=reservation_unit.pk,
            begins=begins,
            tax_level=tax_level,
        )

    ReservationUnitPricing.objects.create(
        reservation_unit_id=reservation_unit.pk,
        begins=datetime.date(2024, 8, 27),
        tax_level=tax_level,
        tax_percentage=TaxPercentage.objects.create(value=Decimal("25.50")),
    )

    apps = migrate_to(BEFORE_MIGRATION)

    TaxPercentage = apps.get_model("tilavarauspalvelu", "TaxPercentage")
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    pricings = ReservationUnitPricing.objects.filter(reservation_unit_id=reservation_unit.pk).order_by("begins")
    assert list(pricings.values_list("begins", "tax_percentage__value")) == [
        (datetime.date(2019, 1, 1), Decimal("24.00")),
        (datetime.date(2024, 8, 27), Decimal("25.50")),
        (datetime.date(2024, 8, 31), Decimal("24.00")),
        (datetime.date(2024, 9, 1), Decimal("25.50")),
    ]
    assert TaxPercentage.objects.count() == 2
