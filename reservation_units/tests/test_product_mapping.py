import uuid

from django.test import TestCase, override_settings

from merchants.verkkokauppa.product.types import Product
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tests.factories import PaymentMerchantFactory, ReservationUnitFactory, ReservationUnitPricingFactory
from tests.helpers import patch_method

product_id = uuid.uuid4()


def mock_create_product(*args, **kwargs):
    return Product(
        product_id=product_id,
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id="bar",
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
class ReservationUnitProductMappingTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.payment_merchant = PaymentMerchantFactory()
        cls.runit = ReservationUnitFactory(name="Test Reservation Unit", is_draft=False)
        cls.pricing = ReservationUnitPricingFactory(reservation_unit=cls.runit)

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_mapping_is_created_when_unit_is_paid_and_has_merchant(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None
        assert self.runit.payment_product.id == product_id

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_mapping_is_not_created_if_merchant_is_missing(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = None
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_mapping_is_not_created_if_unit_is_not_paid(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.pricings.set([])
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None

    @patch_method(VerkkokauppaAPIClient.create_product)
    def test_mapping_is_removed_if_merchant_is_removed(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None

        self.runit.payment_merchant = None
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None
