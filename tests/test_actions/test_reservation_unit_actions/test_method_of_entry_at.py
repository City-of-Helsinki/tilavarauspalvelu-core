from __future__ import annotations

import datetime

import freezegun
import pytest

from tilavarauspalvelu.enums import MethodOfEntry
from utils.date_utils import local_datetime

from tests.factories import ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "method_of_entry",
    [
        MethodOfEntry.OPEN_ACCESS,
        MethodOfEntry.KEYLESS,
        MethodOfEntry.WITH_KEY,
    ],
)
def test_reservation_unit__method_of_entry_at__no_bounds(method_of_entry):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(method_of_entry=method_of_entry)

    assert reservation_unit.actions.get_method_of_entry_at(past) == method_of_entry
    assert reservation_unit.actions.get_method_of_entry_at(now) == method_of_entry
    assert reservation_unit.actions.get_method_of_entry_at(future) == method_of_entry

    assert reservation_unit.current_method_of_entry == method_of_entry


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "method_of_entry",
    [
        MethodOfEntry.OPEN_ACCESS,
        MethodOfEntry.KEYLESS,
        MethodOfEntry.WITH_KEY,
    ],
)
def test_reservation_unit__method_of_entry_at__starts(method_of_entry):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        method_of_entry=method_of_entry,
        method_of_entry_start_date=future.date(),
    )

    assert reservation_unit.actions.get_method_of_entry_at(past) == MethodOfEntry.OPEN_ACCESS
    assert reservation_unit.actions.get_method_of_entry_at(now) == MethodOfEntry.OPEN_ACCESS
    assert reservation_unit.actions.get_method_of_entry_at(future) == method_of_entry

    assert reservation_unit.current_method_of_entry == MethodOfEntry.OPEN_ACCESS


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "method_of_entry",
    [
        MethodOfEntry.OPEN_ACCESS,
        MethodOfEntry.KEYLESS,
        MethodOfEntry.WITH_KEY,
    ],
)
def test_reservation_unit__method_of_entry_at__ends(method_of_entry):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        method_of_entry=method_of_entry,
        method_of_entry_end_date=now.date(),
    )

    assert reservation_unit.actions.get_method_of_entry_at(past) == method_of_entry
    assert reservation_unit.actions.get_method_of_entry_at(now) == method_of_entry
    assert reservation_unit.actions.get_method_of_entry_at(future) == MethodOfEntry.OPEN_ACCESS

    assert reservation_unit.current_method_of_entry == method_of_entry


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "method_of_entry",
    [
        MethodOfEntry.OPEN_ACCESS,
        MethodOfEntry.KEYLESS,
        MethodOfEntry.WITH_KEY,
    ],
)
def test_reservation_unit__method_of_entry_at__period(method_of_entry):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        method_of_entry=method_of_entry,
        method_of_entry_start_date=now.date(),
        method_of_entry_end_date=now.date(),
    )

    assert reservation_unit.actions.get_method_of_entry_at(past) == MethodOfEntry.OPEN_ACCESS
    assert reservation_unit.actions.get_method_of_entry_at(now) == method_of_entry
    assert reservation_unit.actions.get_method_of_entry_at(future) == MethodOfEntry.OPEN_ACCESS

    assert reservation_unit.current_method_of_entry == method_of_entry
