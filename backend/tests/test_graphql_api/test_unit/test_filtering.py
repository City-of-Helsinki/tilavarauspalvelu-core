from __future__ import annotations

import datetime

import freezegun
import pytest

from tilavarauspalvelu.enums import ReservationKind
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UnitGroupFactory, UserFactory

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__filter__by_name(graphql):
    unit = UnitFactory.create(name_fi="1111")
    UnitFactory.create(name_fi="2222")
    UnitFactory.create(name_fi="3333")

    graphql.login_with_superuser()
    response = graphql(units_query(nameFiExact="1111"))

    assert response.has_errors is False, response.errors

    assert len(response.results) == 1
    assert response.results[0] == {"pk": unit.pk}


def test_units__filter__by_unit_group(graphql):
    unit_group = UnitGroupFactory.create()
    unit = UnitFactory.create(unit_groups=[unit_group])
    UnitFactory.create()
    UnitFactory.create()

    graphql.login_with_superuser()
    response = graphql(units_query(unitGroup=[unit_group.pk]))

    assert response.has_errors is False, response.errors

    assert len(response.results) == 1
    assert response.results[0] == {"pk": unit.pk}


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_units__filter__by_published_reservation_units(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")
    unit_4 = UnitFactory.create(name="4")

    publish_date = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

    # Returned
    ReservationUnitFactory.create(unit=unit_1)
    ReservationUnitFactory.create(publish_begins_at=publish_date, unit=unit_2)
    ReservationUnitFactory.create(reservation_begins_at=publish_date + datetime.timedelta(days=30), unit=unit_3)

    # Filtered out
    ReservationUnitFactory.create(is_archived=True, unit=unit_4)
    ReservationUnitFactory.create(publish_begins_at=publish_date + datetime.timedelta(days=30), unit=unit_4)

    graphql.login_with_superuser()

    response = graphql(units_query(published_reservation_units=True, order_by="nameFiAsc"))

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": unit_1.pk}
    assert response.results[1] == {"pk": unit_2.pk}
    assert response.results[2] == {"pk": unit_3.pk}


def test_units__filter__by_own_reservations(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")

    reservation_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    reservation_unit_2 = ReservationUnitFactory.create(unit=unit_2)
    reservation_unit_3 = ReservationUnitFactory.create(unit=unit_3)
    reservation_unit_4 = ReservationUnitFactory.create(unit=unit_3)

    user_1 = UserFactory.create()
    user_2 = UserFactory.create()

    ReservationFactory.create(reservation_unit=reservation_unit_1, user=user_1)
    ReservationFactory.create(reservation_unit=reservation_unit_2, user=user_1)
    ReservationFactory.create(reservation_unit=reservation_unit_3, user=user_2)
    ReservationFactory.create(reservation_unit=reservation_unit_4, user=user_2)

    graphql.force_login(user_1)

    # Own reservations = True
    response = graphql(units_query(own_reservations=True))
    assert response.has_errors is False

    assert len(response.results) == 2
    assert response.results[0] == {"pk": unit_1.pk}
    assert response.results[1] == {"pk": unit_2.pk}

    # Own reservations = False
    response = graphql(units_query(own_reservations=False))
    assert response.has_errors is False

    assert len(response.results) == 1
    assert response.results[0] == {"pk": unit_3.pk}


def test_units__filter__by_only_direct_bookable(graphql):
    # Has only direct reservation unit, should be included
    unit_1 = UnitFactory.create(name="1")
    ReservationUnitFactory.create(unit=unit_1, reservation_kind=ReservationKind.DIRECT)

    # Has only seasonal reservation, should be excluded
    unit_2 = UnitFactory.create(name="2")
    ReservationUnitFactory.create(unit=unit_2, reservation_kind=ReservationKind.SEASON)

    # Has only direct and seasonal reservation, should be included
    unit_3 = UnitFactory.create(name="3")
    ReservationUnitFactory.create(unit=unit_3, reservation_kind=ReservationKind.DIRECT_AND_SEASON)

    # Has both direct and seasonal, and seasonal reservation, should be included
    unit_4 = UnitFactory.create(name="4")
    ReservationUnitFactory.create(unit=unit_4, reservation_kind=ReservationKind.SEASON)
    ReservationUnitFactory.create(unit=unit_4, reservation_kind=ReservationKind.DIRECT_AND_SEASON)

    # Has no reservation units, should be excluded
    UnitFactory.create(name="5")

    query = units_query(only_direct_bookable=True)
    response = graphql(query)
    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": unit_1.pk}
    assert response.results[1] == {"pk": unit_3.pk}
    assert response.results[2] == {"pk": unit_4.pk}


def test_units__filter__by_only_seasonal_bookable(graphql):
    # Has only direct reservation unit, should be excluded
    unit_1 = UnitFactory.create(name="1")
    ReservationUnitFactory.create(unit=unit_1, reservation_kind=ReservationKind.DIRECT)

    # Has only seasonal reservation, should be included
    unit_2 = UnitFactory.create(name="2")
    ReservationUnitFactory.create(unit=unit_2, reservation_kind=ReservationKind.SEASON)

    # Has only direct and seasonal reservation, should be included
    unit_3 = UnitFactory.create(name="3")
    ReservationUnitFactory.create(unit=unit_3, reservation_kind=ReservationKind.DIRECT_AND_SEASON)

    # Has both direct and seasonal, and direct reservation, should be included
    unit_4 = UnitFactory.create(name="4")
    ReservationUnitFactory.create(unit=unit_4, reservation_kind=ReservationKind.DIRECT)
    ReservationUnitFactory.create(unit=unit_4, reservation_kind=ReservationKind.DIRECT_AND_SEASON)

    # Has no reservation units, should be excluded
    UnitFactory.create(name="5")

    query = units_query(only_seasonal_bookable=True)
    response = graphql(query)
    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": unit_2.pk}
    assert response.results[1] == {"pk": unit_3.pk}
    assert response.results[2] == {"pk": unit_4.pk}
