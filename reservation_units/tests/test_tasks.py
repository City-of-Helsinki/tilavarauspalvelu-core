from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import TestCase, override_settings

from merchants.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from merchants.verkkokauppa.product.types import CreateOrUpdateAccountingParams, Product
from reservation_units.tasks import (
    refresh_reservation_unit_accounting,
    refresh_reservation_unit_product_mapping,
)
from tests.factories import (
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)

product_id = uuid4()


def mock_create_product(*args, **kwargs):
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
@mock.patch("reservation_units.tasks.create_or_update_accounting")
@mock.patch(
    "reservation_units.tasks.create_product",
    return_value=mock_create_product(),
)
class ReservationUnitProductMappingTaskTestCase(TaskTestBase):
    def test_task_is_called_on_reservation_unit_save(self, mock_product, mock_create_or_update_accounting):
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_not_none()

    def test_mapping_is_created_when_unit_is_paid_and_has_merchant(
        self, mock_product, mock_create_or_update_accounting
    ):
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_not_none()
        assert_that(self.runit.payment_product.id).is_equal_to(product_id)

    def test_mapping_is_not_created_if_merchant_is_missing(self, mock_product, mock_create_or_update_accounting):
        self.runit.payment_merchant = None
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_none()

    def test_mapping_is_not_created_if_unit_is_not_paid(self, mock_product, mock_create_or_update_accounting):
        self.runit.pricings.set([])
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_product_mapping(self.runit.pk)

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_none()


@override_settings(CELERY_TASK_ALWAYS_EAGER=True, UPDATE_PRODUCT_MAPPING=True)
@mock.patch("reservation_units.tasks.create_or_update_accounting")
@mock.patch(
    "reservation_units.tasks.create_product",
    return_value=mock_create_product(),
)
class ReservationUnitRefreshAccountingTaskTestCase(TaskTestBase):
    def test_accounting_task_is_called_on_reservation_unit_save(self, mock_product, mock_create_or_update_accounting):
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_not_none()

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
        mock_create_or_update_accounting.assert_called_with(self.runit.payment_product.id, expected_params)

    def test_accounting_task_api_not_called_when_accounting_does_not_exist(
        self, mock_product, mock_create_or_update_accounting
    ):
        self.runit.payment_merchant = self.payment_merchant
        self.runit.payment_accounting = None
        self.runit.save()

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_not_none()
        assert_that(mock_create_or_update_accounting.called).is_false()

    def test_accounting_task_api_not_called_when_product_mapping_is_not_needed(
        self, mock_product, mock_create_or_update_accounting
    ):
        self.runit.is_draft = True
        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        self.runit.refresh_from_db()
        assert_that(self.runit.payment_product).is_none()
        assert_that(mock_create_or_update_accounting.called).is_false()

    @mock.patch("reservation_units.tasks.capture_message")
    def test_accounting_task_captures_warning_when_runit_does_not_exist(
        self, mock_capture_message, mock_product, mock_create_or_update_accounting
    ):
        refresh_reservation_unit_accounting(0)
        assert_that(mock_capture_message.called).is_true()

    @mock.patch("reservation_units.tasks.capture_exception")
    def test_accounting_task_captures_api_errors(
        self, mock_capture_exception, mock_product, mock_create_or_update_accounting
    ):
        mock_create_or_update_accounting.side_effect = CreateOrUpdateAccountingError("mock-error")

        self.runit.payment_merchant = self.payment_merchant
        self.runit.save()

        refresh_reservation_unit_accounting(self.runit.pk)
        assert_that(mock_capture_exception.called).is_true()
