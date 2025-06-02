from __future__ import annotations

import pytest

from tests.factories import ReservationSeriesFactory

from .helpers import reservation_series_many_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_series__filter__by_user(graphql):
    reservation_series = ReservationSeriesFactory.create()
    ReservationSeriesFactory.create()
    graphql.login_with_superuser()

    query = reservation_series_many_query(user=reservation_series.user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI"),
        ("reservationUnitNameEn", "EN"),
        ("reservationUnitNameSv", "SV"),
    ],
)
def test_reservation_series__filter__by_reservation_unit_name(graphql, field, value):
    reservation_series = ReservationSeriesFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    ReservationSeriesFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_with_superuser()

    query = reservation_series_many_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI, foo"),
        ("reservationUnitNameEn", "EN, bar"),
        ("reservationUnitNameSv", "SV, baz"),
    ],
)
def test_reservation_series__filter__by_reservation_unit_name__multiple(graphql, field, value):
    reservation_series_1 = ReservationSeriesFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    reservation_series_2 = ReservationSeriesFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_with_superuser()

    query = reservation_series_many_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


def test_reservation_series__filter__by_reservation_unit(graphql):
    reservation_series = ReservationSeriesFactory.create()
    ReservationSeriesFactory.create()
    graphql.login_with_superuser()

    query = reservation_series_many_query(reservationUnit=reservation_series.reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


def test_reservation_series__filter__by_reservation_unit__multiple(graphql):
    reservation_series_1 = ReservationSeriesFactory.create(name="1")
    reservation_series_2 = ReservationSeriesFactory.create(name="2")
    graphql.login_with_superuser()

    query = reservation_series_many_query(
        reservationUnit=[reservation_series_1.reservation_unit.pk, reservation_series_2.reservation_unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


def test_reservation_series__filter__by_unit(graphql):
    reservation_series = ReservationSeriesFactory.create()
    ReservationSeriesFactory.create()
    graphql.login_with_superuser()

    query = reservation_series_many_query(unit=reservation_series.reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


def test_reservation_series__filter__by_unit__multiple(graphql):
    reservation_series_1 = ReservationSeriesFactory.create(name="1")
    reservation_series_2 = ReservationSeriesFactory.create(name="2")
    graphql.login_with_superuser()

    query = reservation_series_many_query(
        unit=[reservation_series_1.reservation_unit.unit.pk, reservation_series_2.reservation_unit.unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


def test_reservation_series__filter__by_reservation_unit_type(graphql):
    reservation_series = ReservationSeriesFactory.create(reservation_unit__reservation_unit_type__name="foo")
    ReservationSeriesFactory.create(reservation_unit__reservation_unit_type__name="bar")
    graphql.login_with_superuser()

    query = reservation_series_many_query(
        reservation_unit_type=reservation_series.reservation_unit.reservation_unit_type.pk,
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_series.pk}


def test_reservation_series__filter__by_reservation_unit_type__multiple(graphql):
    reservation_series_1 = ReservationSeriesFactory.create(
        name="1",
        reservation_unit__reservation_unit_type__name="foo",
    )
    reservation_series_2 = ReservationSeriesFactory.create(
        name="2",
        reservation_unit__reservation_unit_type__name="bar",
    )
    graphql.login_with_superuser()

    query = reservation_series_many_query(
        reservation_unit_type=[
            reservation_series_1.reservation_unit.reservation_unit_type.pk,
            reservation_series_2.reservation_unit.reservation_unit_type.pk,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}
