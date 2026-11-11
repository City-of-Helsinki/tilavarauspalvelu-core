from __future__ import annotations

import datetime
from unittest.mock import patch

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import ReservationUnitFactory, ReservationUnitPricingGroupFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Begin date ──


def test_reservation_unit_pricing_group__one_group_per_reservation_unit_and_date():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    with pytest.raises(IntegrityError) as error:
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    assert "reservation_unit_pricing_group_begins_unique" in str(error.value)


# ── Accounting ──


def test_reservation_unit_pricing_group__save_sends_accounting_of_the_reservation_unit(settings):
    settings.UPDATE_ACCOUNTING = True
    reservation_unit = ReservationUnitFactory.create()

    with patch.object(refresh_reservation_unit_accounting_task, "delay_on_commit") as mock:
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit)

    assert [call.args for call in mock.call_args_list] == [(reservation_unit.pk,)]


def test_reservation_unit_pricing_group__delete_sends_accounting_of_the_reservation_unit(settings):
    settings.UPDATE_ACCOUNTING = True
    reservation_unit = ReservationUnitFactory.create()
    row = ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit)

    with patch.object(refresh_reservation_unit_accounting_task, "delay_on_commit") as mock:
        row.delete()

    assert [call.args for call in mock.call_args_list] == [(reservation_unit.pk,)]
