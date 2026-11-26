from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Any

import pytest
from django.test import override_settings

from tilavarauspalvelu.integrations.verkkokauppa.product.types import Product
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import refresh_reservation_unit_product_mapping_task
from utils.date_utils import local_date

from tests.factories import PaymentMerchantFactory, PaymentProductFactory, PriceComponentFactory, ReservationUnitFactory
from tests.helpers import as_mock, patch_method

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

product_id = uuid.uuid4()


def mock_create_product(*args: Any, **kwargs: Any) -> Product:
    return Product(
        product_id=product_id,
        namespace="tilanvaraus",
        namespace_entity_id="foo",
        merchant_id=uuid.uuid4(),
    )


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__is_paid_and_has_merchant__mapping_is_created(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(), own_price__amount=Decimal(10)
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__reservation_unit_is_saved__mapping_is_created_after_commit(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(), own_price__amount=Decimal(10)
    )
    with django_capture_on_commit_callbacks() as callbacks:
        reservation_unit.save()

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None

    for callback in callbacks:
        callback()

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_is_missing__mapping_is_not_created(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    reservation_unit = ReservationUnitFactory.create(payment_merchant=None, own_price__amount=Decimal(10))
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__unit_is_not_paid__mapping_is_not_created(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(0),
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
    assert as_mock(VerkkokauppaAPIClient.create_product).called is False


@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__no_price__mapping_is_not_created() -> None:
    reservation_unit = ReservationUnitFactory.create(payment_merchant=PaymentMerchantFactory.create())

    refresh_reservation_unit_product_mapping_task(reservation_unit.pk)

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
    assert as_mock(VerkkokauppaAPIClient.create_product).called is False


@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__only_future_price_is_paid__mapping_is_created() -> None:
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(10),
        own_price__begins=local_date() + datetime.timedelta(days=30),
    )

    refresh_reservation_unit_product_mapping_task(reservation_unit.pk)

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__future_price_is_paid__mapping_is_created(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    future = local_date() + datetime.timedelta(days=30)
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(),
        own_price__amount=Decimal(0),
        own_price__valid_until=future,
    )
    PriceComponentFactory.create(
        pricing_group=reservation_unit.reservation_unit_pricing_groups.get().pricing_group,
        valid_from=future,
        amount=Decimal(10),
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_from_unit__mapping_is_created(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    payment_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=None, unit__payment_merchant=payment_merchant, own_price__amount=Decimal(10)
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id
    assert reservation_unit.payment_product.merchant == payment_merchant


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__has_product__mapping_is_refreshed_for_draft(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    payment_merchant = PaymentMerchantFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        payment_merchant=payment_merchant,
        payment_product=PaymentProductFactory.create(merchant=payment_merchant),
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.id == product_id


@override_settings(UPDATE_PRODUCT_MAPPING=True)
@patch_method(VerkkokauppaAPIClient.create_product, return_value=mock_create_product())
def test_refresh_reservation_unit_product_mapping__merchant_is_removed__mapping_is_removed(
    django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks,
) -> None:
    reservation_unit = ReservationUnitFactory.create(
        payment_merchant=PaymentMerchantFactory.create(), own_price__amount=Decimal(10)
    )
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()  # Trigger `refresh_reservation_unit_product_mapping` task

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is not None

    reservation_unit.payment_merchant = None
    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit.save()

    reservation_unit.refresh_from_db()
    assert reservation_unit.payment_product is None
