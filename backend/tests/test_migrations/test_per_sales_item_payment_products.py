from __future__ import annotations

import datetime
import importlib
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.db import connection
from django.db.migrations.executor import MigrationExecutor

from utils.date_utils import local_date

from tests.factories import PriceComponentFactory, ReservationUnitFactory, SalesItemFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from django.db.migrations.state import StateApps

    from tilavarauspalvelu.models import ReservationUnit

migration = importlib.import_module("tilavarauspalvelu.migrations.0199_per_sales_item_payment_products")

BEFORE_MIGRATION = ("tilavarauspalvelu", "0198_sales_item_unique_material_and_main_ledger_account")
AFTER_MIGRATION = ("tilavarauspalvelu", "0199_per_sales_item_payment_products")

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


def give_product(apps: StateApps, reservation_unit: ReservationUnit) -> uuid.UUID:
    PaymentMerchant = apps.get_model("tilavarauspalvelu", "PaymentMerchant")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")

    merchant = PaymentMerchant.objects.create(id=uuid.uuid4(), name="Merchant")
    product = PaymentProduct.objects.create(id=uuid.uuid4(), merchant=merchant)
    ReservationUnit.objects.filter(pk=reservation_unit.pk).update(payment_product=product)
    return product.pk


def product_of(apps: StateApps, product_pk: uuid.UUID) -> tuple[int | None, int | None]:
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")
    product = PaymentProduct.objects.get(pk=product_pk)
    return product.reservation_unit_id, product.sales_item_id


# ── Products ──


def test_per_sales_item_payment_products__product_gets_reservation_unit_and_sales_item_of_today():
    sales_item = SalesItemFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        own_price__amount=Decimal(20),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    apps = migrate_to(BEFORE_MIGRATION)
    product_pk = give_product(apps, reservation_unit)

    apps = migrate_to(AFTER_MIGRATION)

    assert product_of(apps, product_pk) == (reservation_unit.pk, sales_item.pk)


def test_per_sales_item_payment_products__sales_item_of_highest_base_price_today():
    highest_sales_item = SalesItemFactory.create()
    lower_sales_item = SalesItemFactory.create()
    future_sales_item = SalesItemFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        own_price__amount=Decimal(10),
        own_price__tax_level=lower_sales_item.tax_level,
        own_price__sales_item=lower_sales_item,
    )
    pricing_group = reservation_unit.reservation_unit_pricing_groups.get().pricing_group
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        amount=Decimal(20),
        tax_level=highest_sales_item.tax_level,
        sales_item=highest_sales_item,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=local_date() + datetime.timedelta(days=1),
        amount=Decimal(30),
        tax_level=future_sales_item.tax_level,
        sales_item=future_sales_item,
    )

    apps = migrate_to(BEFORE_MIGRATION)
    product_pk = give_product(apps, reservation_unit)

    apps = migrate_to(AFTER_MIGRATION)

    assert product_of(apps, product_pk) == (reservation_unit.pk, highest_sales_item.pk)


def test_per_sales_item_payment_products__price_without_sales_item__product_gets_only_reservation_unit():
    reservation_unit = ReservationUnitFactory.create(own_price__amount=Decimal(20), own_price__sales_item=None)

    apps = migrate_to(BEFORE_MIGRATION)
    product_pk = give_product(apps, reservation_unit)

    apps = migrate_to(AFTER_MIGRATION)

    assert product_of(apps, product_pk) == (reservation_unit.pk, None)


def test_per_sales_item_payment_products__product_of_earlier_merchant_gets_its_reservation_unit(settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    reservation_unit = ReservationUnitFactory.create()

    apps = migrate_to(BEFORE_MIGRATION)
    PaymentMerchant = apps.get_model("tilavarauspalvelu", "PaymentMerchant")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")
    earlier_merchant = PaymentMerchant.objects.create(id=uuid.uuid4(), name="Earlier merchant")
    product_id = migration.verkkokauppa_product_id(
        entity_id=str(reservation_unit.pk),
        merchant_id=str(earlier_merchant.pk),
    )
    PaymentProduct.objects.create(id=product_id, merchant=earlier_merchant)

    apps = migrate_to(AFTER_MIGRATION)

    assert product_of(apps, product_id) == (reservation_unit.pk, None)


def test_per_sales_item_payment_products__product_without_reservation_unit_stops_migration(settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    ReservationUnitFactory.create()

    apps = migrate_to(BEFORE_MIGRATION)
    PaymentMerchant = apps.get_model("tilavarauspalvelu", "PaymentMerchant")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")
    merchant = PaymentMerchant.objects.create(id=uuid.uuid4(), name="Merchant")
    product = PaymentProduct.objects.create(id=uuid.uuid4(), merchant=merchant)

    msg = f"No reservation unit found for payment products: ['{product.pk}']"
    with pytest.raises(migration.PaymentProductMigrationError, match=exact(msg)):
        migrate_to(AFTER_MIGRATION)


def test_per_sales_item_payment_products__product_id_matches_verkkokauppa(settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"

    # A product of the robot test data in the test verkkokauppa.
    product_id = migration.verkkokauppa_product_id(
        entity_id="522",
        merchant_id="9be158db-8e3a-4560-8e68-f3214b207d6c",
    )

    assert product_id == uuid.UUID("630dcc27-1ff1-3e12-b1ea-9df2571a36bc")


def test_per_sales_item_payment_products__reverse_gives_reservation_unit_its_product():
    sales_item = SalesItemFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        own_price__amount=Decimal(20),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    apps = migrate_to(BEFORE_MIGRATION)
    product_pk = give_product(apps, reservation_unit)

    migrate_to(AFTER_MIGRATION)
    apps = migrate_to(BEFORE_MIGRATION)

    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    assert ReservationUnit.objects.get(pk=reservation_unit.pk).payment_product_id == product_pk


def test_per_sales_item_payment_products__reverse_prefers_product_of_current_merchant(settings):
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    reservation_unit = ReservationUnitFactory.create(payment_merchant=None, unit__payment_merchant=None)

    apps = migrate_to(BEFORE_MIGRATION)
    PaymentMerchant = apps.get_model("tilavarauspalvelu", "PaymentMerchant")
    PaymentProduct = apps.get_model("tilavarauspalvelu", "PaymentProduct")
    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    earlier_merchant = PaymentMerchant.objects.create(id=uuid.UUID(int=1), name="Earlier merchant")
    current_merchant = PaymentMerchant.objects.create(id=uuid.UUID(int=2), name="Current merchant")
    earlier_product_id = migration.verkkokauppa_product_id(
        entity_id=str(reservation_unit.pk),
        merchant_id=str(earlier_merchant.pk),
    )
    current_product_id = migration.verkkokauppa_product_id(
        entity_id=str(reservation_unit.pk),
        merchant_id=str(current_merchant.pk),
    )
    PaymentProduct.objects.create(id=earlier_product_id, merchant=earlier_merchant)
    PaymentProduct.objects.create(id=current_product_id, merchant=current_merchant)
    ReservationUnit.objects.filter(pk=reservation_unit.pk).update(
        payment_merchant=current_merchant,
        payment_product=current_product_id,
    )

    migrate_to(AFTER_MIGRATION)
    apps = migrate_to(BEFORE_MIGRATION)

    ReservationUnit = apps.get_model("tilavarauspalvelu", "ReservationUnit")
    assert ReservationUnit.objects.get(pk=reservation_unit.pk).payment_product_id == current_product_id
