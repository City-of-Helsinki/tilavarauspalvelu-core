import uuid

from django.test import TestCase, override_settings

from merchants.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from merchants.verkkokauppa.product.types import CreateOrUpdateAccountingParams, Product
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservation_units.tasks import refresh_reservation_unit_accounting, refresh_reservation_unit_product_mapping
from tests.factories import (
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)
from tests.helpers import patch_method
from utils.sentry import SentryLogger

product_id = uuid.uuid4()


def mock_create_product():
    return Product(
        product_id=product_id,
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id="bar",
    )


class TaskTestBase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.payment_merchant = PaymentMerchantFactory()
        cls.runit = ReservationUnitFactory(name="Test Reservation Unit", is_draft=False)
        cls.pricing = ReservationUnitPricingFactory(reservation_unit=cls.runit)

        cls.accounting = PaymentAccountingFactory()
        cls.runit.payment_accounting = cls.accounting
        cls.runit.save()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, UPDATE_PRODUCT_MAPPING=True)
class ReservationUnitProductMappingTaskTestCase(TaskTestBase):
    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_task_is_called_on_reservation_unit_save(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None

    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_mapping_is_created_when_unit_is_paid_and_has_merchant(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None
        assert self.runit.payment_product.id == product_id

    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_mapping_is_not_created_if_merchant_is_missing(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = None
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None

    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_mapping_is_not_created_if_unit_is_not_paid(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.pricings.set([])
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, UPDATE_PRODUCT_MAPPING=True)
class ReservationUnitRefreshAccountingTaskTestCase(TaskTestBase):
    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_accounting_task_is_called_on_reservation_unit_save(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None

        expected_params = CreateOrUpdateAccountingParams(
            vat_code=self.accounting.vat_code,
            internal_order=self.accounting.internal_order,
            profit_center=self.accounting.profit_center,
            project=self.accounting.project,
            operation_area=self.accounting.operation_area,
            company_code=self.accounting.company_code,
            main_ledger_account=self.accounting.main_ledger_account,
            balance_profit_center=self.accounting.balance_profit_center,
        )
        VerkkokauppaAPIClient.create_or_update_accounting.assert_called_with(
            product_uuid=self.runit.payment_product.id,
            params=expected_params,
        )

    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_accounting_task_api_not_called_when_accounting_does_not_exist(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.payment_merchant = self.payment_merchant
        self.runit.payment_accounting = None
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is not None
        assert VerkkokauppaAPIClient.create_or_update_accounting.called is False

    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_accounting_task_api_not_called_when_product_mapping_is_not_needed(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        self.runit.is_draft = True
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert self.runit.payment_product is None
        assert VerkkokauppaAPIClient.create_or_update_accounting.called is False

    @patch_method(SentryLogger.log_message)
    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_accounting_task_captures_warning_when_runit_does_not_exist(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        refresh_reservation_unit_accounting(0)
        assert SentryLogger.log_message.called is True

    @patch_method(SentryLogger.log_exception)
    @patch_method(VerkkokauppaAPIClient.create_product)
    @patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
    def test_accounting_task_captures_api_errors(self):
        VerkkokauppaAPIClient.create_product.return_value = mock_create_product()
        VerkkokauppaAPIClient.create_or_update_accounting.side_effect = CreateOrUpdateAccountingError("mock-error")

        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_accounting(self.runit.pk)
        assert SentryLogger.log_exception.called is True
