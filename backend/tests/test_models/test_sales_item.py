from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import call, patch

import pytest

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import (
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    SalesItemFactory,
)

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks, Settings

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Accounting ──


def test_sales_item__save_sends_accounting_of_reservation_units_that_use_it(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    sales_item = SalesItemFactory.create()
    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=pricing_group, tax_level=sales_item.tax_level, sales_item=sales_item)
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, pricing_group=pricing_group)
    ReservationUnitFactory.create(own_price__sales_item=SalesItemFactory.create())

    settings.UPDATE_ACCOUNTING = True

    with (
        patch.object(refresh_reservation_unit_accounting_task, "apply_async") as mock,
        django_capture_on_commit_callbacks(execute=True),
    ):
        sales_item.save()

    assert mock.call_args_list == [call(kwargs={"reservation_unit_pks": [reservation_unit.pk]})]


def test_sales_item__save_does_not_send_accounting_when_turned_off(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    settings.UPDATE_ACCOUNTING = False
    sales_item = SalesItemFactory.create()
    ReservationUnitFactory.create(own_price__tax_level=sales_item.tax_level, own_price__sales_item=sales_item)

    with (
        patch.object(refresh_reservation_unit_accounting_task, "apply_async") as mock,
        django_capture_on_commit_callbacks(execute=True),
    ):
        sales_item.save()

    assert mock.call_count == 0
