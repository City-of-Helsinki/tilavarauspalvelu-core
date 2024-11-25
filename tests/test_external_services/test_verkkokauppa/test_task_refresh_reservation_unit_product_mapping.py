import uuid

import pytest
from django.test import override_settings

from tilavarauspalvelu.utils.verkkokauppa.product.types import Product
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

from tests.factories import PaymentMerchantFactory, ReservationUnitFactory, ReservationUnitPricingFactory
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
    reservation_unit.pricings.set([])
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None


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
