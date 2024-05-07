import uuid

from assertpy import assert_that
from django.test import override_settings
from django.test.testcases import TestCase

from merchants.verkkokauppa.product.types import Product
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tests.factories import PaymentMerchantFactory, ReservationUnitFactory, ReservationUnitPricingFactory, UnitFactory
from tests.helpers import patch_method


def mock_create_product():
    return Product(
        product_id=uuid.uuid4(),
        namespace="tilanvaraus",
        namespace_entity_id=str(uuid.uuid4()),
        merchant_id=uuid.uuid4(),
    )


class UnitMerchantUpdateTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.merchant_1 = PaymentMerchantFactory(
            pk=uuid.UUID("f9a94a6e-007d-4157-94f2-5ac9bd6e1a5f"), name="First Merchant"
        )
        cls.merchant_2 = PaymentMerchantFactory(
            pk=uuid.UUID("83c0b65c-2e4f-4600-8466-66f67422bf43"), name="Second Merchant"
        )
        cls.unit = UnitFactory(name="Test unit", payment_merchant=cls.merchant_1)

    @override_settings(UPDATE_PRODUCT_MAPPING=True)
    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_changing_merchant_updates_reservation_units_without_merchant(self):
        VerkkokauppaAPIClient.create_product.side_effect = [
            mock_create_product(),
            mock_create_product(),
            mock_create_product(),
        ]
        reservation_unit_1 = ReservationUnitFactory(name="I should be updated: unit set", unit=self.unit)
        pricing_1 = ReservationUnitPricingFactory(reservation_unit=reservation_unit_1)
        reservation_unit_1.pricings.set([pricing_1])
        reservation_unit_1.save()

        reservation_unit_2 = ReservationUnitFactory(name="I am ignored: no unit set")
        pricing_2 = ReservationUnitPricingFactory(reservation_unit=reservation_unit_2)
        reservation_unit_2.pricings.set([pricing_2])
        reservation_unit_2.save()

        reservation_unit_3 = ReservationUnitFactory(name="I am ignored: own merchant", payment_merchant=self.merchant_1)
        pricing_3 = ReservationUnitPricingFactory(reservation_unit=reservation_unit_3)
        reservation_unit_3.pricings.set([pricing_3])
        reservation_unit_3.save()

        reservation_unit_1.refresh_from_db()
        reservation_unit_2.refresh_from_db()
        reservation_unit_3.refresh_from_db()

        assert_that(reservation_unit_1.payment_product).is_not_none()
        assert_that(reservation_unit_2.payment_product).is_none()
        assert_that(reservation_unit_3.payment_product).is_not_none()

        product_id_1 = reservation_unit_1.payment_product.pk
        product_id_3 = reservation_unit_3.payment_product.pk

        self.unit.payment_merchant = self.merchant_2
        self.unit.save()

        reservation_unit_1.refresh_from_db()
        reservation_unit_2.refresh_from_db()
        reservation_unit_3.refresh_from_db()

        assert_that(reservation_unit_1.payment_product).is_not_none()
        assert_that(reservation_unit_1.payment_product.pk).is_not_equal_to(product_id_1)
        assert_that(reservation_unit_2.payment_product).is_none()
        assert_that(reservation_unit_3.payment_product).is_not_none()
        assert_that(reservation_unit_3.payment_product.pk).is_equal_to(product_id_3)
