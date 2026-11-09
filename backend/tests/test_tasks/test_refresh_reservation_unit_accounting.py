from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.integrations.verkkokauppa.product.types import (
    CreateOrUpdateAccountingParams,
    Product,
    ProductInvoicingParams,
)
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import (
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    PaymentProductFactory,
    ReservationUnitFactory,
    SalesItemFactory,
    TaxLevelFactory,
)
from tests.helpers import patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import SalesItem

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

product_id = uuid.uuid4()


def create_sales_item(*, vat_code: str) -> SalesItem:
    tax_level = TaxLevelFactory.create(rates__vat_code=vat_code)
    return SalesItemFactory.create(tax_level=tax_level)


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
    sales_item = create_sales_item(vat_code="48")
    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = PaymentAccountingFactory.create()
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None

    assert VerkkokauppaAPIClient.create_product.called is True

    VerkkokauppaAPIClient.create_or_update_accounting.assert_called_with(
        product_uuid=reservation_unit.payment_product.id,
        params=CreateOrUpdateAccountingParams(
            vat_code="48",
            internal_order=reservation_unit.payment_accounting.internal_order,
            project=reservation_unit.payment_accounting.project,
            operation_area=reservation_unit.payment_accounting.operation_area,
            company_code=reservation_unit.payment_accounting.company_code,
            main_ledger_account=reservation_unit.payment_accounting.main_ledger_account,
            balance_profit_center=reservation_unit.payment_accounting.balance_profit_center,
            product_invoicing=ProductInvoicingParams(
                sales_org=reservation_unit.payment_accounting.product_invoicing_sales_org,
                sales_office=reservation_unit.payment_accounting.product_invoicing_sales_office,
                material=reservation_unit.payment_accounting.product_invoicing_material,
                order_type=reservation_unit.payment_accounting.product_invoicing_order_type,
            ),
        ),
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__api_not_called_when_accounting_does_not_exist():
    sales_item = create_sales_item(vat_code="48")
    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

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
    reservation_unit = ReservationUnitFactory.create(is_draft=True, own_price__amount=Decimal(10))
    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = PaymentAccountingFactory.create()
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__api_not_called_when_price_today_has_no_sales_item():
    reservation_unit = ReservationUnitFactory.create(
        payment_product=PaymentProductFactory.create(),
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__sales_item=None,
    )

    refresh_reservation_unit_accounting_task(reservation_unit.pk)

    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
@patch_method(SentryLogger.log_message)
def test_refresh_reservation_unit_accounting__api_not_called_when_tax_rate_has_no_vat_code():
    sales_item = create_sales_item(vat_code="")
    reservation_unit = ReservationUnitFactory.create(
        payment_product=PaymentProductFactory.create(),
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_accounting_task(reservation_unit.pk)

    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False
    SentryLogger.log_message.assert_called_once_with(
        "Reservation unit accounting not sent, because the tax rate of its sales item has no VAT code",
        details={
            "reservation_unit_id": reservation_unit.pk,
            "sales_item_id": sales_item.pk,
            "tax_level_id": sales_item.tax_level_id,
        },
        level="error",
    )


@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_reservation_unit_accounting__api_not_called_when_product_mapping_does_not_exist():
    reservation_unit = ReservationUnitFactory.create(
        payment_product=None,
        payment_accounting=PaymentAccountingFactory.create(),
    )

    refresh_reservation_unit_accounting_task(reservation_unit.pk)

    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting, side_effect=CreateOrUpdateAccountingError("test"))
@patch_method(SentryLogger.log_exception)
def test_refresh_reservation_unit_accounting__capture_error__api_errors():
    sales_item = create_sales_item(vat_code="48")
    reservation_unit = ReservationUnitFactory.create(
        is_draft=False,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )
    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.payment_accounting = PaymentAccountingFactory.create()
    reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    assert VerkkokauppaAPIClient.create_product.called is True
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is True
    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_message)
def test_refresh_reservation_unit_accounting__capture_error__reservation_unit_does_not_exist():
    refresh_reservation_unit_accounting_task(0)

    assert SentryLogger.log_message.call_count == 1
