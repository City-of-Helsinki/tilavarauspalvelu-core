from __future__ import annotations

import datetime
import io
import uuid
from decimal import Decimal

import pytest
from django.core.management import CommandError, call_command

from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import Merchant, MerchantInfo
from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import CreateProductError
from tilavarauspalvelu.integrations.verkkokauppa.product.types import Product
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.management.commands.data_creation.create_reservation_related_things import (
    TEST_PAYMENT_MERCHANT_ID,
    TEST_PAYMENT_MERCHANT_NAME,
)
from tilavarauspalvelu.models import PaymentMerchant, PaymentProduct, ReservationUnit, Unit

from tests.factories import PaymentMerchantFactory, PaymentProductFactory, ReservationUnitFactory
from tests.helpers import exact, patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


NEW_MERCHANT_ID = uuid.UUID("11111111-2222-3333-4444-555555555555")


def run_command() -> str:
    output = io.StringIO()
    call_command("refresh_test_verkkokauppa_products", stdout=output, stderr=io.StringIO())
    return output.getvalue()


def build_product(*args, **kwargs) -> Product:
    return Product(
        product_id=uuid.uuid4(),
        namespace="tilanvaraus_dev",
        namespace_entity_id="1",
        merchant_id=uuid.UUID(TEST_PAYMENT_MERCHANT_ID),
    )


def build_merchant_info() -> MerchantInfo:
    return MerchantInfo(
        name=TEST_PAYMENT_MERCHANT_NAME,
        street="Testikatu 1",
        zip="99999",
        city="Korvatunturi",
        email="testi.osoite@osoite.fi",
        phone="+358 50 123 4567",
        url="https://varaamo.dev.hel.ninja/",
        tos_url="https://varaamo.dev.hel.ninja/v1/terms_of_use_pdf/",
        business_id="0201256-6",
        shop_id="1071053",
    )


def build_merchant() -> Merchant:
    now = datetime.datetime(2026, 1, 1, tzinfo=datetime.UTC)
    return Merchant(
        id=NEW_MERCHANT_ID,
        namespace="tilanvaraus_dev",
        created_at=now,
        updated_at=now,
        name=TEST_PAYMENT_MERCHANT_NAME,
        street="Testikatu 1",
        zip="99999",
        city="Korvatunturi",
        email="testi.osoite@osoite.fi",
        phone="+358 50 123 4567",
        url="https://varaamo.dev.hel.ninja/",
        tos_url="https://varaamo.dev.hel.ninja/v1/terms_of_use_pdf/",
        business_id="0201256-6",
        shop_id="1071053",
    )


def create_test_merchant() -> PaymentMerchant:
    return PaymentMerchantFactory.create(id=TEST_PAYMENT_MERCHANT_ID, name=TEST_PAYMENT_MERCHANT_NAME)


@pytest.fixture(autouse=True)
def dev_environment(monkeypatch, settings):
    monkeypatch.setenv("DJANGO_SETTINGS_ENVIRONMENT", "Development")
    settings.MOCK_VERKKOKAUPPA_API_ENABLED = False


# ── Guards ──


@pytest.mark.parametrize("environment", ["Testing", "Staging", "Production"])
def test_refresh_test_verkkokauppa_products__not_dev_environment__refuses_to_run(monkeypatch, environment):
    monkeypatch.setenv("DJANGO_SETTINGS_ENVIRONMENT", environment)

    msg = "This command changes the payment merchant of units, so it can run only in the dev environment."
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


def test_refresh_test_verkkokauppa_products__api_is_mocked__refuses_to_run(settings):
    settings.MOCK_VERKKOKAUPPA_API_ENABLED = True

    msg = "The Verkkokauppa API is mocked, so there is nothing to refresh."
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


def test_refresh_test_verkkokauppa_products__no_test_merchant__refuses_to_run():
    msg = f"No payment merchant '{TEST_PAYMENT_MERCHANT_NAME}'. Run 'create_test_data' first."
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


# ── Products ──


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=build_merchant_info())
@patch_method(VerkkokauppaAPIClient.create_product, side_effect=build_product)
def test_refresh_test_verkkokauppa_products__merchant_exists__products_are_replaced():
    merchant = create_test_merchant()
    old_product = PaymentProductFactory.create(merchant=merchant)
    own_merchant = ReservationUnitFactory.create(
        payment_merchant=merchant,
        payment_product=old_product,
        own_price__amount=Decimal(10),
    )
    unit_merchant = ReservationUnitFactory.create(
        payment_merchant=None,
        unit__payment_merchant=merchant,
        own_price__amount=Decimal(10),
    )

    output = run_command()

    own_merchant = ReservationUnit.objects.get(pk=own_merchant.pk)
    unit_merchant = ReservationUnit.objects.get(pk=unit_merchant.pk)
    assert own_merchant.payment_product_id not in {None, old_product.pk}
    assert unit_merchant.payment_product_id is not None
    assert output == "Refreshed the products of 2 reservation units.\n"


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=build_merchant_info())
@patch_method(VerkkokauppaAPIClient.create_product, side_effect=build_product)
def test_refresh_test_verkkokauppa_products__other_merchant__reservation_unit_is_not_changed():
    create_test_merchant()
    other_merchant = PaymentMerchantFactory.create(name="Pihlajasaarten testikirjasto")
    other_product = PaymentProductFactory.create(merchant=other_merchant)
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=other_merchant,
        payment_product=other_product,
        own_price__amount=Decimal(10),
    )

    output = run_command()

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    assert reservation_unit.payment_merchant_id == other_merchant.pk
    assert reservation_unit.payment_product_id == other_product.pk
    assert output == "Refreshed the products of 0 reservation units.\n"


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=build_merchant_info())
@patch_method(VerkkokauppaAPIClient.create_product, side_effect=CreateProductError("Product creation failed"))
def test_refresh_test_verkkokauppa_products__product_creation_fails__lists_failed_reservation_units():
    merchant = create_test_merchant()
    reservation_unit = ReservationUnitFactory.create(payment_merchant=merchant, own_price__amount=Decimal(10))

    msg = f"Could not create a product for reservation units: [{reservation_unit.pk}]"
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()


# ── Missing merchant ──


@patch_method(VerkkokauppaAPIClient.get_merchant, return_value=None)
@patch_method(VerkkokauppaAPIClient.create_merchant, return_value=build_merchant())
@patch_method(VerkkokauppaAPIClient.create_product, side_effect=build_product)
def test_refresh_test_verkkokauppa_products__merchant_missing_in_verkkokauppa__units_move_to_new_merchant():
    merchant = create_test_merchant()
    old_product = PaymentProductFactory.create(merchant=merchant)
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=merchant,
        payment_product=old_product,
        unit__payment_merchant=merchant,
        own_price__amount=Decimal(10),
    )

    output = run_command()

    reservation_unit = ReservationUnit.objects.get(pk=reservation_unit.pk)
    unit = Unit.objects.get(pk=reservation_unit.unit_id)
    old_product = PaymentProduct.objects.get(pk=old_product.pk)
    assert reservation_unit.payment_merchant_id == NEW_MERCHANT_ID
    assert unit.payment_merchant_id == NEW_MERCHANT_ID
    assert old_product.merchant_id == NEW_MERCHANT_ID
    assert reservation_unit.payment_product_id not in {None, old_product.pk}
    assert list(PaymentMerchant.objects.values_list("pk", flat=True)) == [NEW_MERCHANT_ID]

    assert output == (
        f"Merchant {TEST_PAYMENT_MERCHANT_ID} does not exist in Verkkokauppa. Creating a new one.\n"
        f"Created merchant {NEW_MERCHANT_ID}. "
        f"Update 'TEST_PAYMENT_MERCHANT_ID' to this value, so that 'create_test_data' uses it.\n"
        "Refreshed the products of 1 reservation units.\n"
    )
