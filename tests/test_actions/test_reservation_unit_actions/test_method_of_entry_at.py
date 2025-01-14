from __future__ import annotations

import datetime

import freezegun
import pytest

from tilavarauspalvelu.enums import AccessType
from utils.date_utils import local_datetime

from tests.factories import ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "access_type",
    [
        AccessType.UNRESTRICTED,
        AccessType.ACCESS_CODE,
        AccessType.PHYSICAL_KEY,
    ],
)
def test_reservation_unit__access_type_at__no_bounds(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(access_type=access_type)

    assert reservation_unit.actions.get_access_type_at(past) == access_type
    assert reservation_unit.actions.get_access_type_at(now) == access_type
    assert reservation_unit.actions.get_access_type_at(future) == access_type

    assert reservation_unit.current_access_type == access_type


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "access_type",
    [
        AccessType.UNRESTRICTED,
        AccessType.ACCESS_CODE,
        AccessType.PHYSICAL_KEY,
    ],
)
def test_reservation_unit__access_type_at__starts(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        access_type=access_type,
        access_type_start_date=future.date(),
    )

    assert reservation_unit.actions.get_access_type_at(past) == AccessType.UNRESTRICTED
    assert reservation_unit.actions.get_access_type_at(now) == AccessType.UNRESTRICTED
    assert reservation_unit.actions.get_access_type_at(future) == access_type

    assert reservation_unit.current_access_type == AccessType.UNRESTRICTED


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "access_type",
    [
        AccessType.UNRESTRICTED,
        AccessType.ACCESS_CODE,
        AccessType.PHYSICAL_KEY,
    ],
)
def test_reservation_unit__access_type_at__ends(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        access_type=access_type,
        access_type_end_date=now.date(),
    )

    assert reservation_unit.actions.get_access_type_at(past) == access_type
    assert reservation_unit.actions.get_access_type_at(now) == access_type
    assert reservation_unit.actions.get_access_type_at(future) == AccessType.UNRESTRICTED

    assert reservation_unit.current_access_type == access_type


@freezegun.freeze_time("2025-01-01")
@pytest.mark.parametrize(
    "access_type",
    [
        AccessType.UNRESTRICTED,
        AccessType.ACCESS_CODE,
        AccessType.PHYSICAL_KEY,
    ],
)
def test_reservation_unit__access_type_at__period(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        access_type=access_type,
        access_type_start_date=now.date(),
        access_type_end_date=now.date(),
    )

    assert reservation_unit.actions.get_access_type_at(past) == AccessType.UNRESTRICTED
    assert reservation_unit.actions.get_access_type_at(now) == access_type
    assert reservation_unit.actions.get_access_type_at(future) == AccessType.UNRESTRICTED

    assert reservation_unit.current_access_type == access_type
