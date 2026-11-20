from __future__ import annotations

from unittest.mock import patch

import pytest

from tilavarauspalvelu.tasks import refresh_reservation_unit_payment_products_task

from tests.factories import PaymentProductFactory, ReservationUnitFactory, SalesItemFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Accounting ──


def test_sales_item__save_sends_accounting_of_reservation_units_with_its_products(settings):
    settings.UPDATE_ACCOUNTING = True
    sales_item = SalesItemFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    PaymentProductFactory.create(reservation_unit=reservation_unit, sales_item=sales_item)
    other_reservation_unit = ReservationUnitFactory.create()
    PaymentProductFactory.create(reservation_unit=other_reservation_unit, sales_item=SalesItemFactory.create())

    with patch.object(refresh_reservation_unit_payment_products_task, "delay_on_commit") as mock:
        sales_item.save()

    assert [call.args for call in mock.call_args_list] == [(reservation_unit.pk,)]


def test_sales_item__save_does_not_send_accounting_when_turned_off(settings):
    settings.UPDATE_ACCOUNTING = False
    sales_item = SalesItemFactory.create()
    ReservationUnitFactory.create(own_price__tax_level=sales_item.tax_level, own_price__sales_item=sales_item)

    with patch.object(refresh_reservation_unit_payment_products_task, "delay_on_commit") as mock:
        sales_item.save()

    assert mock.call_count == 0
