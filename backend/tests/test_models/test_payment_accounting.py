from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import PaymentAccountingFactory, ReservationUnitFactory

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@contextmanager
def mock_refresh_reservation_unit_accounting_task() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.tasks."
    path += refresh_reservation_unit_accounting_task.__name__
    path += ".delay"

    with patch(path) as mock:
        yield mock


def test_payment_accounting__webshop_sync_is_not_triggered_when_accounting_is_not_used(settings):
    settings.UPDATE_ACCOUNTING = True

    with mock_refresh_reservation_unit_accounting_task() as mock:
        PaymentAccountingFactory.create()

    assert mock.call_count == 0


def test_payment_accounting__webshop_sync_trigger_reservation_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit = ReservationUnitFactory.create(payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting.save()

    assert mock.call_count == 1
    assert mock.call_args.args == (reservation_unit.pk,)


def test_payment_accounting__webshop_sync_updates_reservation_units_under_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit = ReservationUnitFactory.create(unit__payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting.save()

    assert mock.call_count == 1
    assert mock.call_args.args == (reservation_unit.pk,)


def test_payment_accounting__payment_accounting__webshop_sync_updates_all_unique_reservation_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit_1 = ReservationUnitFactory.create(payment_accounting=payment_accounting)
    reservation_unit_2 = ReservationUnitFactory.create(unit__payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with mock_refresh_reservation_unit_accounting_task() as mock:
        payment_accounting.save()

    assert mock.call_count == 2
    assert sorted(call.args[0] for call in mock.call_args_list) == [reservation_unit_1.pk, reservation_unit_2.pk]


def test_payment_accounting__one_of_the_fields_is_required(settings):
    settings.UPDATE_ACCOUNTING = True

    with pytest.raises(IntegrityError) as error:
        PaymentAccountingFactory.create(
            internal_order="",
            profit_center="",
            project="",
        )

    constraint = "internal_order_profit_center_or_project_required"
    assert constraint in str(error.value)


@pytest.mark.parametrize(
    "field",
    [
        "product_invoicing_sales_org",
        "product_invoicing_sales_office",
        "product_invoicing_material",
        "product_invoicing_order_type",
    ],
)
def test_payment_accounting__product_invoicing_fields_are_required_together(settings, field):
    settings.UPDATE_ACCOUNTING = True

    kwargs: dict[str, Any] = {
        "product_invoicing_sales_org": "1234",
        "product_invoicing_sales_office": "1234",
        "product_invoicing_material": "12341234",
        "product_invoicing_order_type": "ASDF",
        field: "",
    }

    with pytest.raises(IntegrityError) as error:
        PaymentAccountingFactory.create(**kwargs)

    constraint = "product_invoicing_data_together"
    assert constraint in str(error.value)
