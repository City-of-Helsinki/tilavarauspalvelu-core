import uuid

import pytest
from django.test import override_settings

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting
from tilavarauspalvelu.utils.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.utils.verkkokauppa.product.types import CreateOrUpdateAccountingParams, Product
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

from tests.factories import (
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
)
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

product_id = uuid.uuid4()


def mock_create_product():
    return Product(
        product_id=product_id,
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id=uuid.uuid4(),
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__is_called_on_reservation_unit_save():
    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = PaymentAccountingFactory.create()
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None

    assert VerkkokauppaAPIClient.create_product.called is True
    VerkkokauppaAPIClient.create_or_update_accounting.assert_called_with(
        product_uuid=reservation_unit.payment_product.id,
        params=CreateOrUpdateAccountingParams(
            vat_code=reservation_unit.payment_accounting.vat_code,
            internal_order=reservation_unit.payment_accounting.internal_order,
            profit_center=reservation_unit.payment_accounting.profit_center,
            project=reservation_unit.payment_accounting.project,
            operation_area=reservation_unit.payment_accounting.operation_area,
            company_code=reservation_unit.payment_accounting.company_code,
            main_ledger_account=reservation_unit.payment_accounting.main_ledger_account,
            balance_profit_center=reservation_unit.payment_accounting.balance_profit_center,
        ),
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__api_not_called_when_accounting_does_not_exist():
    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)

    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = None
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__api_not_called_when_product_mapping_is_not_needed():
    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = None
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting, side_effect=CreateOrUpdateAccountingError("test"))
@patch_method(SentryLogger.log_exception)
def test_refresh_reservation_unit_accounting__capture_error__api_errors():
    reservation_unit = ReservationUnitFactory.create(is_draft=False)
    ReservationUnitPricingFactory.create(reservation_unit=reservation_unit)
    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = PaymentAccountingFactory.create()
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    assert VerkkokauppaAPIClient.create_product.called is True
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is True
    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_message)
def test_refresh_reservation_unit_accounting__capture_error__reservation_unit_does_not_exist():
    refresh_reservation_unit_accounting(0)

    assert SentryLogger.log_message.call_count == 1
