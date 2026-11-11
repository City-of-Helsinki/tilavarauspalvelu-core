from __future__ import annotations

from unittest.mock import patch

import pytest

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import (
    PriceComponentFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    SalesItemFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Accounting ──


def test_sales_item__save_sends_accounting_of_reservation_units_that_use_it(settings):
    settings.UPDATE_ACCOUNTING = True
    sales_item = SalesItemFactory.create()
    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=pricing_group, tax_level=sales_item.tax_level, sales_item=sales_item)
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, pricing_group=pricing_group)
    ReservationUnitFactory.create(own_price__sales_item=SalesItemFactory.create())

    with patch.object(refresh_reservation_unit_accounting_task, "delay_on_commit") as mock:
        sales_item.save()

    assert [call.args for call in mock.call_args_list] == [(reservation_unit.pk,)]


def test_sales_item__save_does_not_send_accounting_when_turned_off(settings):
    settings.UPDATE_ACCOUNTING = False
    sales_item = SalesItemFactory.create()
    ReservationUnitFactory.create(own_price__tax_level=sales_item.tax_level, own_price__sales_item=sales_item)

    with patch.object(refresh_reservation_unit_accounting_task, "delay_on_commit") as mock:
        sales_item.save()

    assert mock.call_count == 0
