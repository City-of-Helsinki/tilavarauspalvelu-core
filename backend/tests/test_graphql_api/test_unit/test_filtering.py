from __future__ import annotations

import datetime

import freezegun
import pytest
from django.utils.timezone import get_default_timezone
from graphene_django.settings import graphene_settings

from tilavarauspalvelu.enums import ReservationKind

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UserFactory

from .helpers import units_all_query, units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("gql_query", [units_query, units_all_query])
def test_units__filter__by_name(graphql, gql_query):
    unit = UnitFactory.create(name_fi="1111")
    UnitFactory.create(name_fi="2222")
    UnitFactory.create(name_fi="3333")

    graphql.login_with_superuser()
    response = graphql(gql_query(nameFi="111"))

    assert response.has_errors is False, response.errors

    if gql_query == units_query:
        assert len(response.edges) == 1
        assert response.node(0) == {"pk": unit.pk}
    else:
        assert len(response.first_query_object) == 1
        assert response.first_query_object[0] == {"pk": unit.pk}


@freezegun.freeze_time("2021-01-01T12:00:00Z")
@pytest.mark.parametrize("gql_query", [units_query, units_all_query])
def test_units__filter__by_published_reservation_units(graphql, gql_query):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")
    unit_4 = UnitFactory.create(name="4")

    publish_date = datetime.datetime.now(tz=get_default_timezone())

    # Returned
    ReservationUnitFactory.create(unit=unit_1)
    ReservationUnitFactory.create(publish_begins=publish_date, unit=unit_2)
    ReservationUnitFactory.create(reservation_begins=publish_date + datetime.timedelta(days=30), unit=unit_3)

    # Filtered out
    ReservationUnitFactory.create(is_archived=True, unit=unit_4)
    ReservationUnitFactory.create(publish_begins=publish_date + datetime.timedelta(days=30), unit=unit_4)

    graphql.login_with_superuser()

    response = graphql(gql_query(published_reservation_units=True, order_by="nameFiAsc"))

    assert response.has_errors is False

    if gql_query == units_query:
        assert len(response.edges) == 3
        assert response.node(0) == {"pk": unit_1.pk}
        assert response.node(1) == {"pk": unit_2.pk}
        assert response.node(2) == {"pk": unit_3.pk}
    else:
        assert len(response.first_query_object) == 3
        assert response.first_query_object[0] == {"pk": unit_1.pk}
        assert response.first_query_object[1] == {"pk": unit_2.pk}
        assert response.first_query_object[2] == {"pk": unit_3.pk}


@pytest.mark.parametrize("gql_query", [units_query, units_all_query])
def test_units__filter__by_own_reservations(graphql, gql_query):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")

    res_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    res_unit_2 = ReservationUnitFactory.create(unit=unit_2)
    res_unit_3 = ReservationUnitFactory.create(unit=unit_3)
    res_unit_4 = ReservationUnitFactory.create(unit=unit_3)

    user_1 = UserFactory.create()
    user_2 = UserFactory.create()

    ReservationFactory.create(reservation_units=[res_unit_1], user=user_1)
    ReservationFactory.create(reservation_units=[res_unit_2], user=user_1)
    ReservationFactory.create(reservation_units=[res_unit_3], user=user_2)
    ReservationFactory.create(reservation_units=[res_unit_4], user=user_2)

    graphql.force_login(user_1)

    # Own reservations = True
    response = graphql(gql_query(own_reservations=True))
    assert response.has_errors is False

    if gql_query == units_query:
        assert len(response.edges) == 2
        assert response.node(0) == {"pk": unit_1.pk}
        assert response.node(1) == {"pk": unit_2.pk}
    else:
        assert len(response.first_query_object) == 2
        assert response.first_query_object[0] == {"pk": unit_1.pk}
        assert response.first_query_object[1] == {"pk": unit_2.pk}

    # Own reservations = False
    response = graphql(gql_query(own_reservations=False))
    assert response.has_errors is False

    if gql_query == units_query:
        assert len(response.edges) == 1
        assert response.node(0) == {"pk": unit_3.pk}
    else:
        assert len(response.first_query_object) == 1
        assert response.first_query_object[0] == {"pk": unit_3.pk}


@pytest.mark.parametrize("gql_query", [units_query, units_all_query])
def test_units__filter__by_only_direct_bookable(graphql, gql_query):
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

    query = gql_query(only_direct_bookable=True)
    response = graphql(query)
    assert response.has_errors is False

    if gql_query == units_query:
        assert len(response.edges) == 3
        assert response.node(0) == {"pk": unit_1.pk}
        assert response.node(1) == {"pk": unit_3.pk}
        assert response.node(2) == {"pk": unit_4.pk}
    else:
        assert len(response.first_query_object) == 3
        assert response.first_query_object[0] == {"pk": unit_1.pk}
        assert response.first_query_object[1] == {"pk": unit_3.pk}
        assert response.first_query_object[2] == {"pk": unit_4.pk}


@pytest.mark.parametrize("gql_query", [units_query, units_all_query])
def test_units__filter__by_only_seasonal_bookable(graphql, gql_query):
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

    query = gql_query(only_seasonal_bookable=True)
    response = graphql(query)
    assert response.has_errors is False

    if gql_query == units_query:
        assert len(response.edges) == 3
        assert response.node(0) == {"pk": unit_2.pk}
        assert response.node(1) == {"pk": unit_3.pk}
        assert response.node(2) == {"pk": unit_4.pk}
    else:
        assert len(response.first_query_object) == 3
        assert response.first_query_object[0] == {"pk": unit_2.pk}
        assert response.first_query_object[1] == {"pk": unit_3.pk}
        assert response.first_query_object[2] == {"pk": unit_4.pk}


def test_unit_all__no_pagination_limit(graphql):
    graphene_settings.RELAY_CONNECTION_MAX_LIMIT = 1

    UnitFactory.create_batch(2)

    graphql.login_with_superuser()
    query = units_all_query(fields="pk nameFi nameEn nameSv tprekId")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.first_query_object) == 2
