from __future__ import annotations

import datetime
import uuid

import pytest
from django.test import override_settings

from tilavarauspalvelu.integrations.verkkokauppa.product.types import Product
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_date

from tests.factories import (
    PaymentMerchantFactory,
    PaymentProductFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

product_id = uuid.uuid4()


def mock_create_product(*args, **kwargs):
    return Product(
        product_id=product_id,
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id=uuid.uuid4(),
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__is_paid_and_has_merchant__mapping_is_created():
    reservation_unit = ReservationUnitFactory.create(payment_merchant=PaymentMerchantFactory.create())
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_is_missing__mapping_is_not_created():
    reservation_unit = ReservationUnitFactory.create(payment_merchant=None)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__unit_is_not_paid__mapping_is_not_created():
    reservation_unit = ReservationUnitFactory.create(payment_merchant=PaymentMerchantFactory.create())
    ReservationUnitPricingFactory.create_free(reservation_unit=reservation_unit)
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
    assert VerkkokauppaAPIClient.create_product.called is False


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__future_pricing_is_paid__mapping_is_created():
    reservation_unit = ReservationUnitFactory.create(payment_merchant=PaymentMerchantFactory.create())
    ReservationUnitPricingFactory.create_free(reservation_unit=reservation_unit)
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=local_date() + datetime.timedelta(days=30),
    )
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_from_unit__mapping_is_created():
    payment_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(payment_merchant=None, unit__payment_merchant=payment_merchant)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id
    assert reservation_unit.payment_product.merchant == payment_merchant


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__has_product__mapping_is_refreshed_for_draft():
    payment_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        payment_merchant=payment_merchant,
        payment_product=PaymentProductFactory.create(merchant=payment_merchant),
    )
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_is_removed__mapping_is_removed():
    reservation_unit = ReservationUnitFactory.create(payment_merchant=PaymentMerchantFactory.create())
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None

    reservation_unit.payment_merchant = None
    reservation_unit.save()

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
