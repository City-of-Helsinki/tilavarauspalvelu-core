from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from django.test import override_settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError
from tilavarauspalvelu.integrations.verkkokauppa.product.types import (
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
    ProductInvoicingParams,
)
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentProduct
from tilavarauspalvelu.tasks import refresh_reservation_unit_payment_products_task
from utils.date_utils import local_date

from tests.factories import (
    PaymentAccountingFactory,
    PaymentMerchantFactory,
    PaymentProductFactory,
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
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


# ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────


def create_sales_item(*, vat_code: str = "48") -> SalesItem:
    tax_level = TaxLevelFactory.create(rates__vat_code=vat_code)
    return SalesItemFactory.create(tax_level=tax_level)


def mock_create_product(*, params: CreateProductParams) -> Product:
    return Product(
        product_id=uuid.uuid4(),
        namespace=params.namespace,
        namespace_entity_id=params.namespace_entity_id,
        merchant_id=uuid.UUID(params.merchant_id),
    )


# ── Creating products ────────────────────────────────────────────────────────────────────────────────────────────────


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__reservation_unit_save__creates_product_after_commit(
    django_capture_on_commit_callbacks,
):
    sales_item = create_sales_item()
    merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    with django_capture_on_commit_callbacks() as callbacks:
        reservation_unit.payment_merchant = merchant
        reservation_unit.save()

    assert PaymentProduct.objects.exists() is False

    for callback in callbacks:
        callback()

    product = PaymentProduct.objects.get()
    assert product.reservation_unit == reservation_unit
    assert product.sales_item == sales_item
    assert product.merchant == merchant

    VerkkokauppaAPIClient.create_product.assert_called_once_with(
        params=CreateProductParams(
            namespace="tilanvaraus",
            namespace_entity_id=f"{reservation_unit.pk}:{sales_item.pk}",
            merchant_id=str(merchant.pk),
        ),
    )


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__two_sales_items__creates_product_for_each():
    first_sales_item = create_sales_item()
    second_sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=first_sales_item.tax_level,
        own_price__sales_item=first_sales_item,
    )
    PriceComponentFactory.create(
        pricing_group=reservation_unit.reservation_unit_pricing_groups.get().pricing_group,
        amount=Decimal(5),
        tax_level=second_sales_item.tax_level,
        sales_item=second_sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    products = PaymentProduct.objects.filter(reservation_unit=reservation_unit)
    assert sorted(products.values_list("sales_item", flat=True)) == sorted([first_sales_item.pk, second_sales_item.pk])


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__future_price__creates_product():
    sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
        own_price__begins=local_date() + datetime.timedelta(days=30),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.get().sales_item == sales_item


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__ended_price__creates_no_product():
    sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
        own_price__valid_until=local_date(),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.exists() is False
    assert VerkkokauppaAPIClient.create_product.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__merchant_from_unit__creates_product():
    sales_item = create_sales_item()
    merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=None,
        unit__payment_merchant=merchant,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.get().merchant == merchant


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__no_merchant__creates_no_product():
    sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=None,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.exists() is False
    assert VerkkokauppaAPIClient.create_product.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__price_without_sales_item__creates_no_product():
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__sales_item=None,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.exists() is False
    assert VerkkokauppaAPIClient.create_product.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__product_exists__creates_no_product():
    merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=merchant,
        own_price__amount=Decimal(10),
        payment_product__id=uuid.uuid4(),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.count() == 1
    assert VerkkokauppaAPIClient.create_product.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__merchant_changed__creates_product_and_keeps_old_one():
    old_merchant = PaymentMerchantFactory.create()
    new_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=old_merchant,
        own_price__amount=Decimal(10),
        payment_product__id=uuid.uuid4(),
    )
    old_product = PaymentProduct.objects.get()

    reservation_unit.payment_merchant = new_merchant
    reservation_unit.save()
    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    new_product = PaymentProduct.objects.exclude(pk=old_product.pk).get()
    assert new_product.merchant == new_merchant
    assert new_product.sales_item == old_product.sales_item
    assert PaymentProduct.objects.filter(pk=old_product.pk, merchant=old_merchant).exists() is True


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__draft__creates_no_product():
    sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.exists() is False
    assert VerkkokauppaAPIClient.create_product.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__existing_product_of_other_unit__is_not_used():
    sales_item = create_sales_item()
    merchant = PaymentMerchantFactory.create()
    other_reservation_unit = ReservationUnitFactory.create()
    PaymentProductFactory.create(reservation_unit=other_reservation_unit, sales_item=sales_item, merchant=merchant)
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=merchant,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert PaymentProduct.objects.filter(reservation_unit=reservation_unit, sales_item=sales_item).exists() is True


# ── Sending accounting ───────────────────────────────────────────────────────────────────────────────────────────────


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__sends_accounting_of_sales_item_and_place():
    sales_item = SalesItemFactory.create(
        tax_level=TaxLevelFactory.create(rates__vat_code="48"),
        material="10000116",
        main_ledger_account="350080",
    )
    accounting = PaymentAccountingFactory.create(main_ledger_account="340025", product_invoicing_material="12345678")
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=accounting,
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    product = PaymentProduct.objects.get()
    VerkkokauppaAPIClient.create_or_update_accounting.assert_called_once_with(
        product_uuid=product.pk,
        params=CreateOrUpdateAccountingParams(
            vat_code="48",
            internal_order=accounting.internal_order,
            project=accounting.project,
            operation_area=accounting.operation_area,
            company_code=accounting.company_code,
            main_ledger_account="350080",
            balance_profit_center=accounting.balance_profit_center,
            product_invoicing=ProductInvoicingParams(
                sales_org=accounting.product_invoicing_sales_org,
                sales_office=accounting.product_invoicing_sales_office,
                material="10000116",
                order_type=accounting.product_invoicing_order_type,
            ),
        ),
    )


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__shared_pricing_group__each_unit_sends_its_own_place_accounting():
    sales_item = create_sales_item()
    merchant = PaymentMerchantFactory.create()
    first_accounting = PaymentAccountingFactory.create(company_code="1111")
    second_accounting = PaymentAccountingFactory.create(company_code="2222")
    first_reservation_unit = ReservationUnitFactory.create(
        payment_merchant=merchant, payment_accounting=first_accounting
    )
    second_reservation_unit = ReservationUnitFactory.create(
        payment_merchant=merchant,
        payment_accounting=second_accounting,
    )

    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        amount=Decimal(10),
        tax_level=sales_item.tax_level,
        sales_item=sales_item,
    )
    ReservationUnitPricingGroupFactory.create(reservation_unit=first_reservation_unit, pricing_group=pricing_group)
    ReservationUnitPricingGroupFactory.create(reservation_unit=second_reservation_unit, pricing_group=pricing_group)

    refresh_reservation_unit_payment_products_task(first_reservation_unit.pk)
    refresh_reservation_unit_payment_products_task(second_reservation_unit.pk)

    first_product = PaymentProduct.objects.get(reservation_unit=first_reservation_unit)
    second_product = PaymentProduct.objects.get(reservation_unit=second_reservation_unit)
    assert first_product.pk != second_product.pk

    calls = VerkkokauppaAPIClient.create_or_update_accounting.call_args_list
    company_codes = {call.kwargs["product_uuid"]: call.kwargs["params"].company_code for call in calls}
    assert company_codes == {first_product.pk: "1111", second_product.pk: "2222"}


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__accounting_from_unit():
    accounting = PaymentAccountingFactory.create(company_code="3333")
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=None,
        unit__payment_accounting=accounting,
        own_price__amount=Decimal(10),
        own_price__tax_level__rates__vat_code="48",
        payment_product__id=uuid.uuid4(),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    params = VerkkokauppaAPIClient.create_or_update_accounting.call_args.kwargs["params"]
    assert params.company_code == "3333"


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__sends_accounting_only_for_products_of_current_merchant():
    old_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=old_merchant,
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level__rates__vat_code="48",
        payment_product__id=uuid.uuid4(),
    )
    old_product = PaymentProduct.objects.get()

    reservation_unit.payment_merchant = PaymentMerchantFactory.create()
    reservation_unit.save()
    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    new_product = PaymentProduct.objects.exclude(pk=old_product.pk).get()
    VerkkokauppaAPIClient.create_or_update_accounting.assert_called_once()
    assert VerkkokauppaAPIClient.create_or_update_accounting.call_args.kwargs["product_uuid"] == new_product.pk


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__draft__sends_accounting_of_existing_product():
    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level__rates__vat_code="48",
        payment_product__id=uuid.uuid4(),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    product = PaymentProduct.objects.get()
    VerkkokauppaAPIClient.create_or_update_accounting.assert_called_once()
    assert VerkkokauppaAPIClient.create_or_update_accounting.call_args.kwargs["product_uuid"] == product.pk


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
def test_refresh_payment_products__no_accounting__sends_no_accounting():
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=None,
        unit__payment_accounting=None,
        own_price__amount=Decimal(10),
        payment_product__id=uuid.uuid4(),
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting)
@patch_method(SentryLogger.log_message)
def test_refresh_payment_products__tax_rate_has_no_vat_code__sends_no_accounting():
    sales_item = create_sales_item(vat_code="")
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=sales_item.tax_level,
        own_price__sales_item=sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    product = PaymentProduct.objects.get()
    assert VerkkokauppaAPIClient.create_or_update_accounting.called is False
    SentryLogger.log_message.assert_called_once_with(
        "Payment product accounting not sent, because the tax rate of its sales item has no VAT code",
        details={
            "reservation_unit_id": reservation_unit.pk,
            "payment_product_id": str(product.pk),
            "sales_item_id": sales_item.pk,
            "tax_level_id": sales_item.tax_level_id,
        },
        level="error",
    )


@patch_method(VerkkokauppaAPIClient.create_product, side_effect=mock_create_product)
@patch_method(VerkkokauppaAPIClient.create_or_update_accounting, side_effect=CreateOrUpdateAccountingError("test"))
@patch_method(SentryLogger.log_exception)
def test_refresh_payment_products__accounting_api_error__logs_error_for_each_product():
    first_sales_item = create_sales_item()
    second_sales_item = create_sales_item()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        payment_accounting=PaymentAccountingFactory.create(),
        own_price__amount=Decimal(10),
        own_price__tax_level=first_sales_item.tax_level,
        own_price__sales_item=first_sales_item,
    )
    PriceComponentFactory.create(
        pricing_group=reservation_unit.reservation_unit_pricing_groups.get().pricing_group,
        amount=Decimal(5),
        tax_level=second_sales_item.tax_level,
        sales_item=second_sales_item,
    )

    refresh_reservation_unit_payment_products_task(reservation_unit.pk)

    assert VerkkokauppaAPIClient.create_or_update_accounting.call_count == 2
    assert SentryLogger.log_exception.call_count == 2


# ── Task ─────────────────────────────────────────────────────────────────────────────────────────────────────────────


@patch_method(SentryLogger.log_message)
def test_refresh_payment_products__reservation_unit_does_not_exist__logs_message():
    refresh_reservation_unit_payment_products_task(0)

    assert SentryLogger.log_message.call_count == 1
