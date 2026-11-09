from __future__ import annotations

import datetime
import io
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.core.management import CommandError, call_command

from tilavarauspalvelu.models import PaymentAccounting, ReservationUnit, ReservationUnitPricing
from utils.date_utils import local_date

from tests.factories import PaymentAccountingFactory, ReservationUnitFactory, TaxLevelFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TaxLevel

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def create_pricing(
    *,
    reservation_unit: ReservationUnit,
    tax_level: TaxLevel,
    begins: datetime.date | None = None,
) -> ReservationUnitPricing:
    return ReservationUnitPricing.objects.create(
        reservation_unit=reservation_unit,
        begins=begins or local_date(),
        payment_type="ONLINE",
        lowest_price=Decimal(0),
        highest_price=Decimal(20),
        tax_level=tax_level,
    )


def run_command() -> str:
    output = io.StringIO()
    call_command("fix_pricing_migration_conflicts", stdout=output)
    return output.getvalue()


@pytest.fixture
def tax_free_tax_level() -> TaxLevel:
    return TaxLevelFactory.create(name="Veroton", rates__percentage=Decimal(0))


# ── Fixes ──


def test_fix_pricing_migration_conflicts__unit_without_accounting_gets_test_accounting(tax_free_tax_level):
    tax_level = TaxLevelFactory.create(name="Yleinen", rates__percentage=Decimal("25.5"))
    reservation_unit = ReservationUnitFactory.create(
        name="Sali", payment_accounting=None, unit__payment_accounting=None
    )
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level)

    output = run_command()

    reservation_unit = ReservationUnit.objects.select_related("payment_accounting").get(pk=reservation_unit.pk)
    accounting = reservation_unit.payment_accounting
    assert accounting.name == "Testitiliöinti"
    assert accounting.product_invoicing_material == ""

    assert output == (
        f"Reservation unit {reservation_unit.pk} 'Sali': uses the test accounting {accounting.pk} 'Testitiliöinti'.\n"
        "Made 1 changes.\n"
        "No conflicts. The pricing migrations can run.\n"
    )


def test_fix_pricing_migration_conflicts__accounting_without_material_is_not_changed(tax_free_tax_level):
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal("25.5"))
    accounting = PaymentAccountingFactory.create(
        product_invoicing_sales_org="",
        product_invoicing_sales_office="",
        product_invoicing_material="",
        product_invoicing_order_type="",
    )
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level)

    output = run_command()

    accounting = PaymentAccounting.objects.get(pk=accounting.pk)
    assert accounting.product_invoicing_material == ""
    assert accounting.product_invoicing_sales_org == ""
    assert accounting.product_invoicing_sales_office == ""
    assert accounting.product_invoicing_order_type == ""

    assert output == "Made 0 changes.\nNo conflicts. The pricing migrations can run.\n"


def test_fix_pricing_migration_conflicts__material_of_other_tax_level_gets_copied_accounting(tax_free_tax_level):
    general = TaxLevelFactory.create(name="Yleinen", rates__percentage=Decimal("25.5"))
    reduced = TaxLevelFactory.create(name="Alennettu", rates__percentage=Decimal("13.5"))
    accounting = PaymentAccountingFactory.create(name="Kirjasto", product_invoicing_material="10003360")
    first = ReservationUnitFactory.create(payment_accounting=accounting)
    second = ReservationUnitFactory.create(payment_accounting=None, unit__payment_accounting=accounting)
    create_pricing(reservation_unit=first, tax_level=general)
    create_pricing(reservation_unit=second, tax_level=reduced)

    output = run_command()

    first = ReservationUnit.objects.select_related("payment_accounting").get(pk=first.pk)
    second = ReservationUnit.objects.select_related("payment_accounting").get(pk=second.pk)
    assert first.payment_accounting.pk == accounting.pk
    assert first.payment_accounting.product_invoicing_material == "10003360"
    assert second.payment_accounting.name == "Kirjasto, Alennettu"
    assert second.payment_accounting.product_invoicing_material == "99000000"

    assert output.endswith("No conflicts. The pricing migrations can run.\n")


def test_fix_pricing_migration_conflicts__made_up_material_skips_used_materials(tax_free_tax_level):
    general = TaxLevelFactory.create(rates__percentage=Decimal("25.5"))
    reduced = TaxLevelFactory.create(rates__percentage=Decimal("13.5"))
    PaymentAccountingFactory.create(product_invoicing_material="99000000")
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10003360")
    first = ReservationUnitFactory.create(payment_accounting=accounting)
    second = ReservationUnitFactory.create(payment_accounting=accounting)
    create_pricing(reservation_unit=first, tax_level=general)
    create_pricing(reservation_unit=second, tax_level=reduced)

    run_command()

    second = ReservationUnit.objects.select_related("payment_accounting").get(pk=second.pk)
    assert second.payment_accounting.product_invoicing_material == "99000001"


# ── Not fixed ──


def test_fix_pricing_migration_conflicts__first_pricing_in_the_future_is_not_fixed(tax_free_tax_level):
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal("25.5"))
    future = local_date() + datetime.timedelta(days=10)
    reservation_unit = ReservationUnitFactory.create(
        name="Sali", payment_accounting=None, unit__payment_accounting=None
    )
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level, begins=future)

    msg = (
        "The pricing migrations would stop:\n"
        f"- Reservation unit {reservation_unit.pk} 'Sali' has no pricing today. "
        f"Its first pricing begins on {future.isoformat()}."
    )
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert reservation_unit.payment_accounting is None


def test_fix_pricing_migration_conflicts__refuses_to_run_in_production(monkeypatch):
    monkeypatch.setenv("DJANGO_SETTINGS_ENVIRONMENT", "Production")

    msg = "This command makes up accounting data, so it cannot run in production."
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()
