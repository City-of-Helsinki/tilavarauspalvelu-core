from __future__ import annotations

import datetime
import importlib
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from utils.date_utils import local_date

from tests.factories import PaymentAccountingFactory, ReservationUnitFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from django.db.migrations.state import StateApps

    from tilavarauspalvelu.models import ReservationUnit

migration = importlib.import_module("tilavarauspalvelu.migrations.0192_migrate_pricings_to_pricing_groups")

BEFORE_MIGRATION = ("tilavarauspalvelu", "0191_make_sales_item_material_optional")
AFTER_MIGRATION = ("tilavarauspalvelu", "0192_migrate_pricings_to_pricing_groups")

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


def create_accounting_without_invoicing(*, name: str = "Tili", main_ledger_account: str = "350080") -> Any:
    return PaymentAccountingFactory.create(
        name=name,
        main_ledger_account=main_ledger_account,
        product_invoicing_sales_org="",
        product_invoicing_sales_office="",
        product_invoicing_material="",
        product_invoicing_order_type="",
    )


def create_tax_level(apps: StateApps, *, name: str, percentage: Decimal) -> Any:
    TaxLevel = apps.get_model("tilavarauspalvelu", "TaxLevel")
    TaxLevelRate = apps.get_model("tilavarauspalvelu", "TaxLevelRate")

    tax_level = TaxLevel.objects.create(name=name)
    TaxLevelRate.objects.create(tax_level=tax_level, begins=datetime.date(2000, 1, 1), percentage=percentage)
    return tax_level


def create_pricing(
    apps: StateApps,
    *,
    reservation_unit: ReservationUnit,
    tax_level: Any,
    begins: datetime.date,
    highest_price: Decimal = Decimal(20),
    payment_type: str | None = "ON_SITE",
    price_unit: str = "PER_HOUR",
) -> Any:
    ReservationUnitPricing = apps.get_model("tilavarauspalvelu", "ReservationUnitPricing")

    return ReservationUnitPricing.objects.create(
        reservation_unit_id=reservation_unit.pk,
        begins=begins,
        price_unit=price_unit,
        payment_type=payment_type,
        lowest_price=Decimal(0),
        highest_price=highest_price,
        material_price_description="Materials",
        material_price_description_fi="Materiaalit",
        material_price_description_en="Materials",
        material_price_description_sv="Material",
        tax_level=tax_level,
    )


# ── Pricing groups ──


def test_migrate_pricings_to_pricing_groups__own_pricing_group_from_pricings():
    reservation_unit = ReservationUnitFactory.create(name="Sali", name_fi="Sali", name_en="Hall", name_sv="Sal")
    today = local_date()
    past = today - datetime.timedelta(days=100)
    active = today - datetime.timedelta(days=10)
    future = today + datetime.timedelta(days=10)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=past, highest_price=Decimal(0))
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=active)
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=future,
        highest_price=Decimal(30),
        price_unit="FIXED",
    )

    apps = migrate_to(AFTER_MIGRATION)

    PricingGroup = apps.get_model("tilavarauspalvelu", "PricingGroup")
    ReservationUnitPricingGroup = apps.get_model("tilavarauspalvelu", "ReservationUnitPricingGroup")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")

    pricing_groups = PricingGroup.objects.values_list("name", "name_fi", "name_en", "name_sv", "unit_group")
    assert list(pricing_groups) == [("Sali", "Sali", "Hall", "Sal", None)]

    rows = ReservationUnitPricingGroup.objects.values_list("reservation_unit", "begins")
    assert list(rows) == [(reservation_unit.pk, past)]

    components = PriceComponent.objects.order_by("valid_from").values_list(
        "kind",
        "valid_from",
        "valid_until",
        "price_option",
        "amount",
        "price_unit",
        "can_apply_for_discount",
        "material_price_description_fi",
        "material_price_description_en",
        "material_price_description_sv",
        "tax_level__name",
        "sales_item",
    )
    assert list(components) == [
        (
            "BASE",
            past,
            active,
            None,
            Decimal(0),
            "PER_HOUR",
            False,
            "Materiaalit",
            "Materials",
            "Material",
            "Yleinen",
            None,
        ),
        (
            "BASE",
            active,
            future,
            None,
            Decimal(20),
            "PER_HOUR",
            False,
            "Materiaalit",
            "Materials",
            "Material",
            "Yleinen",
            None,
        ),
        (
            "BASE",
            future,
            None,
            None,
            Decimal(30),
            "FIXED",
            False,
            "Materiaalit",
            "Materials",
            "Material",
            "Yleinen",
            None,
        ),
    ]


def test_migrate_pricings_to_pricing_groups__skips_reservation_unit_with_pricing_group():
    reservation_unit = ReservationUnitFactory.create()
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=today)

    PricingGroup = apps.get_model("tilavarauspalvelu", "PricingGroup")
    ReservationUnitPricingGroup = apps.get_model("tilavarauspalvelu", "ReservationUnitPricingGroup")
    pricing_group = PricingGroup.objects.create(name="Jaettu")
    ReservationUnitPricingGroup.objects.create(
        reservation_unit_id=reservation_unit.pk,
        pricing_group=pricing_group,
        begins=today,
    )

    apps = migrate_to(AFTER_MIGRATION)

    PricingGroup = apps.get_model("tilavarauspalvelu", "PricingGroup")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(PricingGroup.objects.values_list("name", flat=True)) == ["Jaettu"]
    assert PriceComponent.objects.exists() is False


def test_migrate_pricings_to_pricing_groups__free_pricing_group_for_reservation_unit_without_pricings():
    reservation_unit = ReservationUnitFactory.create(name="Sali", name_fi="Sali", name_en="Hall", name_sv="Sal")

    apps = migrate_to(BEFORE_MIGRATION)
    create_tax_level(apps, name="Veroton", percentage=Decimal(0))

    apps = migrate_to(AFTER_MIGRATION)

    PricingGroup = apps.get_model("tilavarauspalvelu", "PricingGroup")
    ReservationUnitPricingGroup = apps.get_model("tilavarauspalvelu", "ReservationUnitPricingGroup")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")

    pricing_groups = PricingGroup.objects.values_list("name", "name_fi", "name_en", "name_sv", "unit_group")
    assert list(pricing_groups) == [("Sali", "Sali", "Hall", "Sal", None)]

    rows = ReservationUnitPricingGroup.objects.values_list("reservation_unit", "begins")
    assert list(rows) == [(reservation_unit.pk, datetime.date(2000, 1, 1))]

    components = PriceComponent.objects.values_list(
        "kind",
        "valid_from",
        "valid_until",
        "price_option",
        "amount",
        "price_unit",
        "can_apply_for_discount",
        "tax_level__name",
        "sales_item",
    )
    assert list(components) == [
        ("BASE", datetime.date(2000, 1, 1), None, None, Decimal(0), "FIXED", False, "Veroton", None),
    ]


def test_migrate_pricings_to_pricing_groups__error_when_no_tax_free_tax_level():
    ReservationUnitFactory.create()

    migrate_to(BEFORE_MIGRATION)

    msg = "Tax level 'Veroton' for the reservation units without pricings does not exist."
    with pytest.raises(migration.PricingMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


@pytest.mark.parametrize(
    ("can_apply_free_of_charge", "highest_price", "can_apply_for_discount"),
    [
        (True, Decimal(20), True),
        (True, Decimal(0), False),
        (False, Decimal(20), False),
    ],
)
def test_migrate_pricings_to_pricing_groups__can_apply_for_discount(
    can_apply_free_of_charge, highest_price, can_apply_for_discount
):
    reservation_unit = ReservationUnitFactory.create(can_apply_free_of_charge=can_apply_free_of_charge)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=local_date(),
        highest_price=highest_price,
    )

    apps = migrate_to(AFTER_MIGRATION)

    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(PriceComponent.objects.values_list("can_apply_for_discount", flat=True)) == [can_apply_for_discount]


# ── Payment type ──


def test_migrate_pricings_to_pricing_groups__payment_type_from_active_paid_pricing():
    reservation_unit = ReservationUnitFactory.create(payment_type=None)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=today - datetime.timedelta(days=10),
        payment_type="ONLINE",
    )
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=today, payment_type="ON_SITE")

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    assert ReservationUnit.objects.get(pk=reservation_unit.pk).payment_type == "ON_SITE"


def test_migrate_pricings_to_pricing_groups__payment_type_from_future_paid_pricing_when_active_is_free():
    reservation_unit = ReservationUnitFactory.create(payment_type=None)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=today,
        highest_price=Decimal(0),
        payment_type=None,
    )
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=today + datetime.timedelta(days=10),
        payment_type="ON_SITE",
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    assert ReservationUnit.objects.get(pk=reservation_unit.pk).payment_type == "ON_SITE"


def test_migrate_pricings_to_pricing_groups__no_payment_type_when_free():
    reservation_unit = ReservationUnitFactory.create(payment_type=None)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=local_date(),
        highest_price=Decimal(0),
        payment_type="ON_SITE",
    )

    apps = migrate_to(AFTER_MIGRATION)

    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    assert ReservationUnit.objects.get(pk=reservation_unit.pk).payment_type is None


# ── Sales items ──


def test_migrate_pricings_to_pricing_groups__sales_item_from_accounting_material():
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)
    today = local_date()
    past = today - datetime.timedelta(days=100)

    apps = migrate_to(BEFORE_MIGRATION)
    general = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    reduced = create_tax_level(apps, name="Alennettu", percentage=Decimal("13.50"))
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=reduced, begins=past, payment_type="ONLINE")
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=general, begins=today, payment_type="ONLINE")

    apps = migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")

    sales_items = SalesItem.objects.values_list("name", "material", "main_ledger_account", "tax_level__name")
    assert list(sales_items) == [("10000116", "10000116", "350080", "Yleinen")]

    components = PriceComponent.objects.order_by("valid_from").values_list("valid_from", "sales_item__material")
    assert list(components) == [(past, None), (today, "10000116")]


def test_migrate_pricings_to_pricing_groups__sales_item_from_unit_accounting():
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=None, unit__payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=local_date(),
        payment_type="ONLINE_OR_INVOICE",
    )

    apps = migrate_to(AFTER_MIGRATION)

    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(PriceComponent.objects.values_list("sales_item__material", flat=True)) == ["10000116"]


@pytest.mark.parametrize(
    ("payment_type", "highest_price"),
    [
        ("ON_SITE", Decimal(20)),
        ("ONLINE", Decimal(0)),
        ("ONLINE_OR_INVOICE", Decimal(0)),
    ],
)
def test_migrate_pricings_to_pricing_groups__no_sales_item_when_not_paid_online(payment_type, highest_price):
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=local_date(),
        highest_price=highest_price,
        payment_type=payment_type,
    )

    apps = migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert SalesItem.objects.exists() is False
    assert list(PriceComponent.objects.values_list("sales_item", flat=True)) == [None]


def test_migrate_pricings_to_pricing_groups__uses_existing_sales_item():
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date(), payment_type="ONLINE"
    )

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    sales_item = SalesItem.objects.create(
        name="Salivuokra",
        material="10000116",
        main_ledger_account="350080",
        tax_level=tax_level,
    )

    apps = migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(SalesItem.objects.values_list("name", flat=True)) == ["Salivuokra"]
    assert list(PriceComponent.objects.values_list("sales_item", flat=True)) == [sales_item.pk]


def test_migrate_pricings_to_pricing_groups__sales_item_without_material_from_tax_level_and_main_ledger_account():
    accounting_1 = create_accounting_without_invoicing(name="Tili 1", main_ledger_account="350080")
    accounting_2 = create_accounting_without_invoicing(name="Tili 2", main_ledger_account="350080")
    accounting_3 = create_accounting_without_invoicing(name="Tili 3", main_ledger_account="350090")
    reservation_unit_1 = ReservationUnitFactory.create(payment_accounting=accounting_1)
    reservation_unit_2 = ReservationUnitFactory.create(payment_accounting=accounting_2)
    reservation_unit_3 = ReservationUnitFactory.create(payment_accounting=accounting_3)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(apps, reservation_unit=reservation_unit_1, tax_level=tax_level, begins=today, payment_type="ONLINE")
    create_pricing(apps, reservation_unit=reservation_unit_2, tax_level=tax_level, begins=today, payment_type="ONLINE")
    create_pricing(apps, reservation_unit=reservation_unit_3, tax_level=tax_level, begins=today, payment_type="ONLINE")

    apps = migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")

    sales_items = SalesItem.objects.order_by("name").values_list(
        "name",
        "material",
        "main_ledger_account",
        "tax_level__name",
    )
    assert list(sales_items) == [
        ("Yleinen, 350080", "", "350080", "Yleinen"),
        ("Yleinen, 350090", "", "350090", "Yleinen"),
    ]

    components = PriceComponent.objects.order_by("pricing_group__reservation_unit_pricing_groups__reservation_unit")
    assert list(components.values_list("sales_item__name", flat=True)) == [
        "Yleinen, 350080",
        "Yleinen, 350080",
        "Yleinen, 350090",
    ]


def test_migrate_pricings_to_pricing_groups__uses_existing_sales_item_without_material():
    accounting = create_accounting_without_invoicing(main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date(), payment_type="ONLINE"
    )

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    sales_item = SalesItem.objects.create(
        name="Salivuokra",
        material="",
        main_ledger_account="350080",
        tax_level=tax_level,
    )

    apps = migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(SalesItem.objects.values_list("name", flat=True)) == ["Salivuokra"]
    assert list(PriceComponent.objects.values_list("sales_item", flat=True)) == [sales_item.pk]


def test_migrate_pricings_to_pricing_groups__past_online_pricing_needs_no_accounting():
    reservation_unit = ReservationUnitFactory.create(payment_accounting=None, unit__payment_accounting=None)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=today - datetime.timedelta(days=10),
        payment_type="ONLINE",
    )
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=today, payment_type="ON_SITE")

    apps = migrate_to(AFTER_MIGRATION)

    PriceComponent = apps.get_model("tilavarauspalvelu", "PriceComponent")
    assert list(PriceComponent.objects.values_list("sales_item", flat=True)) == [None, None]


# ── Conflicts ──


def test_migrate_pricings_to_pricing_groups__error_when_first_pricing_is_in_the_future():
    reservation_unit = ReservationUnitFactory.create(name="Sali")
    future = local_date() + datetime.timedelta(days=10)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=future)

    msg = (
        "Cannot move the pricings to pricing groups:\n"
        f"- Reservation unit {reservation_unit.pk} 'Sali' has no pricing today. "
        f"Its first pricing begins on {future.isoformat()}."
    )
    with pytest.raises(migration.PricingMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


def test_migrate_pricings_to_pricing_groups__error_when_no_accounting():
    reservation_unit = ReservationUnitFactory.create(
        name="Sali",
        payment_accounting=None,
        unit__payment_accounting=None,
    )

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    pricing = create_pricing(
        apps,
        reservation_unit=reservation_unit,
        tax_level=tax_level,
        begins=local_date(),
        payment_type="ONLINE",
    )

    msg = (
        "Cannot move the pricings to pricing groups:\n"
        f"- Reservation unit {reservation_unit.pk} 'Sali', pricing {pricing.pk}: no payment accounting."
    )
    with pytest.raises(migration.PricingMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


def test_migrate_pricings_to_pricing_groups__error_when_material_has_two_tax_levels():
    accounting = PaymentAccountingFactory.create(
        name="Tili",
        product_invoicing_material="10000116",
        main_ledger_account="350080",
    )
    reservation_unit_1 = ReservationUnitFactory.create(name="Sali", payment_accounting=accounting)
    reservation_unit_2 = ReservationUnitFactory.create(name="Sauna", payment_accounting=accounting)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    general = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    reduced = create_tax_level(apps, name="Alennettu", percentage=Decimal("13.50"))
    pricing_1 = create_pricing(
        apps,
        reservation_unit=reservation_unit_1,
        tax_level=general,
        begins=today,
        payment_type="ONLINE",
    )
    pricing_2 = create_pricing(
        apps,
        reservation_unit=reservation_unit_2,
        tax_level=reduced,
        begins=today,
        payment_type="ONLINE",
    )

    msg = (
        "Cannot move the pricings to pricing groups:\n"
        "- Material 10000116 has more than one tax level or main ledger account: "
        f"tax level {general.pk} with main ledger account 350080, "
        f"tax level {reduced.pk} with main ledger account 350080. Used by:\n"
        f"    Reservation unit {reservation_unit_1.pk} 'Sali', pricing {pricing_1.pk}, "
        f"payment accounting {accounting.pk} 'Tili'\n"
        f"    Reservation unit {reservation_unit_2.pk} 'Sauna', pricing {pricing_2.pk}, "
        f"payment accounting {accounting.pk} 'Tili'"
    )
    with pytest.raises(migration.PricingMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


def test_migrate_pricings_to_pricing_groups__error_when_material_has_two_main_ledger_accounts():
    accounting_1 = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350080")
    accounting_2 = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350090")
    reservation_unit_1 = ReservationUnitFactory.create(payment_accounting=accounting_1)
    reservation_unit_2 = ReservationUnitFactory.create(payment_accounting=accounting_2)
    today = local_date()

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(apps, reservation_unit=reservation_unit_1, tax_level=tax_level, begins=today, payment_type="ONLINE")
    create_pricing(apps, reservation_unit=reservation_unit_2, tax_level=tax_level, begins=today, payment_type="ONLINE")

    with pytest.raises(migration.PricingMigrationError, match="Material 10000116 has more than one tax level"):
        migrate_to(AFTER_MIGRATION)

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    assert SalesItem.objects.exists() is False


def test_migrate_pricings_to_pricing_groups__error_when_existing_sales_item_differs():
    accounting = PaymentAccountingFactory.create(product_invoicing_material="10000116", main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    create_pricing(
        apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date(), payment_type="ONLINE"
    )

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    SalesItem.objects.create(name="Salivuokra", material="10000116", main_ledger_account="350090", tax_level=tax_level)

    with pytest.raises(migration.PricingMigrationError, match="Material 10000116 has more than one tax level"):
        migrate_to(AFTER_MIGRATION)


def test_migrate_pricings_to_pricing_groups__error_when_name_of_sales_item_without_material_is_taken():
    accounting = create_accounting_without_invoicing(name="Tili", main_ledger_account="350080")
    reservation_unit = ReservationUnitFactory.create(name="Sali", payment_accounting=accounting)

    apps = migrate_to(BEFORE_MIGRATION)
    tax_level = create_tax_level(apps, name="Yleinen", percentage=Decimal("25.50"))
    pricing = create_pricing(
        apps, reservation_unit=reservation_unit, tax_level=tax_level, begins=local_date(), payment_type="ONLINE"
    )

    SalesItem = apps.get_model("tilavarauspalvelu", "SalesItem")
    SalesItem.objects.create(
        name="Yleinen, 350080",
        material="10000116",
        main_ledger_account="350080",
        tax_level=tax_level,
    )

    msg = (
        "Cannot move the pricings to pricing groups:\n"
        f"- A sales item without a material for tax level {tax_level.pk} with main ledger account 350080 "
        "needs the name 'Yleinen, 350080', but another sales item has it. Used by:\n"
        f"    Reservation unit {reservation_unit.pk} 'Sali', pricing {pricing.pk}, "
        f"payment accounting {accounting.pk} 'Tili'"
    )
    with pytest.raises(migration.PricingMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)
