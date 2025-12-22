from __future__ import annotations

import datetime

import freezegun
import pytest
from lookup_property import L

from tilavarauspalvelu.enums import AccessType
from utils.date_utils import local_datetime

from tests.factories import ReservationUnitAccessTypeFactory, ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2025-01-01")
def test_reservation_unit__access_types__end_date():
    now = local_datetime()

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=now.date(),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=now.date() + datetime.timedelta(days=7),
    )

    qs = reservation_unit.access_types.annotate(end_date=L("end_date")).order_by("begin_date").values("end_date")
    assert list(qs) == [
        {"end_date": datetime.date(2025, 1, 8)},
        {"end_date": datetime.date.max},
    ]


@freezegun.freeze_time("2025-01-01")
def test_reservation_unit__access_types__active():
    now = local_datetime()

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=now.date(),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=now.date() + datetime.timedelta(days=7),
    )

    qs = (
        reservation_unit.access_types
        .active()
        .annotate(end_date=L("end_date"))
        .order_by("begin_date")
        .values("access_type", "begin_date", "end_date")
    )
    assert list(qs) == [
        {
            "access_type": AccessType.UNRESTRICTED,
            "begin_date": datetime.date(2025, 1, 1),
            "end_date": datetime.date(2025, 1, 8),
        },
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
def test_reservation_unit__access_type_at(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        access_types__access_type=access_type,
        access_types__begin_date=now.date(),
    )

    assert reservation_unit.actions.get_access_type_at(past) is None
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
def test_reservation_unit__access_type_at__null(access_type):
    now = local_datetime()
    past = now - datetime.timedelta(days=1)
    future = now + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create(
        access_types__access_type=access_type,
        access_types__begin_date=future.date(),
    )

    assert reservation_unit.actions.get_access_type_at(past) is None
    assert reservation_unit.actions.get_access_type_at(now) is None
    assert reservation_unit.actions.get_access_type_at(future) == access_type

    assert reservation_unit.current_access_type is None


def test_reservation_unit__get_access_types_on_period():
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=datetime.date(2025, 1, 1),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=datetime.date(2025, 1, 3),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
        begin_date=datetime.date(2025, 1, 6),
    )

    begin_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 1, 7)

    mapping = reservation_unit.actions.get_access_types_on_period(begin_date=begin_date, end_date=end_date)

    assert mapping == {
        datetime.date(2025, 1, 1): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 2): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 3): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 4): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 5): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 6): AccessType.OPENED_BY_STAFF,
        datetime.date(2025, 1, 7): AccessType.OPENED_BY_STAFF,
    }


def test_reservation_unit__get_access_types_on_period__starts_before_period():
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=datetime.date(2025, 1, 1),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=datetime.date(2025, 1, 5),
    )

    begin_date = datetime.date(2025, 1, 3)
    end_date = datetime.date(2025, 1, 7)

    mapping = reservation_unit.actions.get_access_types_on_period(begin_date=begin_date, end_date=end_date)

    assert mapping == {
        datetime.date(2025, 1, 3): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 4): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 5): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 6): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 7): AccessType.ACCESS_CODE,
    }


def test_reservation_unit__get_access_types_on_period__no_active_access_type_in_the_beginning():
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=datetime.date(2025, 1, 2),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=datetime.date(2025, 1, 5),
    )

    begin_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 1, 7)

    mapping = reservation_unit.actions.get_access_types_on_period(begin_date=begin_date, end_date=end_date)

    assert mapping == {
        # Value for 'datetime.date(2025, 1, 1)' missing since there is no access type active on that date
        datetime.date(2025, 1, 2): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 3): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 4): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 5): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 6): AccessType.ACCESS_CODE,
        datetime.date(2025, 1, 7): AccessType.ACCESS_CODE,
    }


def test_reservation_unit__get_access_types_on_period__single():
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=datetime.date(2025, 1, 1),
    )

    begin_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 1, 7)

    mapping = reservation_unit.actions.get_access_types_on_period(begin_date=begin_date, end_date=end_date)

    assert mapping == {
        datetime.date(2025, 1, 1): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 2): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 3): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 4): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 5): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 6): AccessType.UNRESTRICTED,
        datetime.date(2025, 1, 7): AccessType.UNRESTRICTED,
    }


def test_reservation_unit__get_access_types_on_period__no_access_types():
    reservation_unit = ReservationUnitFactory.create()

    begin_date = datetime.date(2025, 1, 1)
    end_date = datetime.date(2025, 1, 7)

    mapping = reservation_unit.actions.get_access_types_on_period(begin_date=begin_date, end_date=end_date)

    assert mapping == {}
