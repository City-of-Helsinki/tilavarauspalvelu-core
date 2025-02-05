from __future__ import annotations

from unittest.mock import patch

import pytest
from django.core.exceptions import ValidationError

from tests.factories import PaymentAccountingFactory, ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_webshop_sync_is_not_triggered_when_accounting_is_not_used(settings):
    settings.UPDATE_ACCOUNTING = True

    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        PaymentAccountingFactory.create()

    assert mock.call_count == 0


def test_webshop_sync_trigger_reservation_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit = ReservationUnitFactory.create(payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting.save()

    assert mock.call_count == 1
    assert mock.call_args.args == (reservation_unit.pk,)


def test_webshop_sync_updates_reservation_units_under_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit = ReservationUnitFactory.create(unit__payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting.save()

    assert mock.call_count == 1
    assert mock.call_args.args == (reservation_unit.pk,)


def test_webshop_sync_updates_all_unique_reservation_units(settings):
    settings.UPDATE_ACCOUNTING = True

    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting = PaymentAccountingFactory.create()

    assert mock.call_count == 0

    reservation_unit_1 = ReservationUnitFactory.create(payment_accounting=payment_accounting)
    reservation_unit_2 = ReservationUnitFactory.create(unit__payment_accounting=payment_accounting)

    payment_accounting.refresh_from_db()
    with patch("tilavarauspalvelu.tasks.refresh_reservation_unit_accounting.delay") as mock:
        payment_accounting.save()

    assert mock.call_count == 2
    assert sorted(call.args[0] for call in mock.call_args_list) == [reservation_unit_1.pk, reservation_unit_2.pk]


def test_one_of_the_fields_is_required(settings):
    settings.UPDATE_ACCOUNTING = True

    payment_accounting = PaymentAccountingFactory.create(
        name="Invalid",
        internal_order="",
        profit_center="",
        project="",
    )
    with pytest.raises(ValidationError) as error:
        payment_accounting.full_clean()

    assert error.value.message_dict == {
        "internal_order": ["One of the following fields must be given: internal_order, profit_center, project"],
        "profit_center": ["One of the following fields must be given: internal_order, profit_center, project"],
        "project": ["One of the following fields must be given: internal_order, profit_center, project"],
    }
