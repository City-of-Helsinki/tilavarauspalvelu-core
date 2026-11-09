from __future__ import annotations

import datetime
import io
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.core.management import CommandError, call_command

from tilavarauspalvelu.models import ReservationUnitPricing
from utils.date_utils import local_date

from tests.factories import (
    PaymentAccountingFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    SalesItemFactory,
    TaxLevelFactory,
)
from tests.helpers import exact

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, TaxLevel

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def create_pricing(
    *,
    reservation_unit: ReservationUnit,
    tax_level: TaxLevel,
    begins: datetime.date,
    payment_type: str = "ONLINE",
) -> ReservationUnitPricing:
    return ReservationUnitPricing.objects.create(
        reservation_unit=reservation_unit,
        begins=begins,
        payment_type=payment_type,
        lowest_price=Decimal(0),
        highest_price=Decimal(20),
        tax_level=tax_level,
    )


def run_command() -> str:
    output = io.StringIO()
    call_command("check_pricing_migration_conflicts", stdout=output)
    return output.getvalue()


# ── No conflicts ──


def test_check_pricing_migration_conflicts__no_conflicts():
    tax_level = TaxLevelFactory.create(name="Veroton", rates__percentage=Decimal(0))
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date())
    ReservationUnitFactory.create()
    ReservationFactory.create(tax_percentage_value=Decimal(0))

    assert run_command() == "No conflicts. The pricing migrations can run.\n"


def test_check_pricing_migration_conflicts__accounting_without_material():
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(0))
    accounting = PaymentAccountingFactory.create(
        product_invoicing_sales_org="",
        product_invoicing_sales_office="",
        product_invoicing_material="",
        product_invoicing_order_type="",
    )
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date())

    assert run_command() == "No conflicts. The pricing migrations can run.\n"


def test_check_pricing_migration_conflicts__skips_reservation_unit_with_pricing_group():
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(0))
    reservation_unit = ReservationUnitFactory.create(payment_accounting=None, unit__payment_accounting=None)
    create_pricing(reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date())
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit)

    assert run_command() == "No conflicts. The pricing migrations can run.\n"


# ── Conflicts ──


def test_check_pricing_migration_conflicts__lists_all_conflicts():
    tax_level = TaxLevelFactory.create(name="Yleinen", rates__percentage=Decimal("25.5"))
    TaxLevelFactory.create(name="Veroton", rates__percentage=Decimal(0))
    future = local_date() + datetime.timedelta(days=10)

    no_accounting = ReservationUnitFactory.create(name="Sali", payment_accounting=None, unit__payment_accounting=None)
    no_accounting_pricing = create_pricing(reservation_unit=no_accounting, tax_level=tax_level, begins=local_date())

    future_only = ReservationUnitFactory.create(name="Sauna")
    create_pricing(reservation_unit=future_only, tax_level=tax_level, begins=future)

    ReservationFactory.create(tax_percentage_value=Decimal("23.00"))

    msg = (
        "The pricing migrations would stop:\n"
        f"- Reservation unit {no_accounting.pk} 'Sali', pricing {no_accounting_pricing.pk}: no payment accounting.\n"
        f"- Reservation unit {future_only.pk} 'Sauna' has no pricing today. "
        f"Its first pricing begins on {future.isoformat()}.\n"
        "- No single tax level for the tax percentages of reservations: [Decimal('23.00')]"
    )
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


def test_check_pricing_migration_conflicts__material_with_existing_sales_item_of_other_tax_level():
    general = TaxLevelFactory.create(rates__percentage=Decimal("25.5"))
    reduced = TaxLevelFactory.create(rates__percentage=Decimal("13.5"))
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)
    create_pricing(reservation_unit=reservation_unit, tax_level=general, begins=local_date())
    SalesItemFactory.create(material="10000116", main_ledger_account="350080", tax_level=reduced)

    with pytest.raises(CommandError, match="Material 10000116 has more than one tax level or main ledger account"):
        run_command()


def test_check_pricing_migration_conflicts__name_of_sales_item_without_material_is_taken():
    tax_level = TaxLevelFactory.create(name="Yleinen", rates__percentage=Decimal("25.5"))
    accounting = PaymentAccountingFactory.create(
        name="Tili",
        main_ledger_account="350080",
        product_invoicing_sales_org="",
        product_invoicing_sales_office="",
        product_invoicing_material="",
        product_invoicing_order_type="",
    )
    reservation_unit = ReservationUnitFactory.create(name="Sali", payment_accounting=accounting)
    pricing = create_pricing(reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date())
    SalesItemFactory.create(name="Yleinen, 350080", material="10000116", tax_level=tax_level)

    msg = (
        "The pricing migrations would stop:\n"
        f"- A sales item without a material for tax level {tax_level.pk} with main ledger account 350080 "
        "needs the name 'Yleinen, 350080', but another sales item has it. Used by:\n"
        f"    Reservation unit {reservation_unit.pk} 'Sali', pricing {pricing.pk}, "
        f"payment accounting {accounting.pk} 'Tili'"
    )
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


def test_check_pricing_migration_conflicts__no_tax_free_tax_level():
    ReservationUnitFactory.create()

    msg = (
        "The pricing migrations would stop:\n"
        "- Tax level 'Veroton' for the reservation units without pricings does not exist."
    )
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()
