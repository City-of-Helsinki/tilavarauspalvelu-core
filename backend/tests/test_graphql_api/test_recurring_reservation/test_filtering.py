from __future__ import annotations

import pytest

from tests.factories import RecurringReservationFactory

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__filter__by_user(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_with_superuser()

    query = recurring_reservations_query(user=recurring_reservation.user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI"),
        ("reservationUnitNameEn", "EN"),
        ("reservationUnitNameSv", "SV"),
    ],
)
def test_recurring_reservations__filter__by_reservation_unit_name(graphql, field, value):
    recurring_reservation = RecurringReservationFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    RecurringReservationFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_with_superuser()

    query = recurring_reservations_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("reservationUnitNameFi", "FI, foo"),
        ("reservationUnitNameEn", "EN, bar"),
        ("reservationUnitNameSv", "SV, baz"),
    ],
)
def test_recurring_reservations__filter__by_reservation_unit_name__multiple(graphql, field, value):
    recurring_reservation_1 = RecurringReservationFactory.create(
        name="1",
        reservation_unit__name_fi="FI",
        reservation_unit__name_en="EN",
        reservation_unit__name_sv="SV",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        name="2",
        reservation_unit__name_fi="foo",
        reservation_unit__name_en="bar",
        reservation_unit__name_sv="baz",
    )
    graphql.login_with_superuser()

    query = recurring_reservations_query(**{field: value})
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_reservation_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_with_superuser()

    query = recurring_reservations_query(reservationUnit=recurring_reservation.reservation_unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_reservation_unit__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(name="1")
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")
    graphql.login_with_superuser()

    query = recurring_reservations_query(
        reservationUnit=[recurring_reservation_1.reservation_unit.pk, recurring_reservation_2.reservation_unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_unit(graphql):
    recurring_reservation = RecurringReservationFactory.create()
    RecurringReservationFactory.create()
    graphql.login_with_superuser()

    query = recurring_reservations_query(unit=recurring_reservation.reservation_unit.unit.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_unit__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(name="1")
    recurring_reservation_2 = RecurringReservationFactory.create(name="2")
    graphql.login_with_superuser()

    query = recurring_reservations_query(
        unit=[recurring_reservation_1.reservation_unit.unit.pk, recurring_reservation_2.reservation_unit.unit.pk],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__filter__by_reservation_unit_type(graphql):
    recurring_reservation = RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="foo")
    RecurringReservationFactory.create(reservation_unit__reservation_unit_type__name="bar")
    graphql.login_with_superuser()

    query = recurring_reservations_query(
        reservation_unit_type=recurring_reservation.reservation_unit.reservation_unit_type.pk,
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node(0) == {"pk": recurring_reservation.pk}


def test_recurring_reservations__filter__by_reservation_unit_type__multiple(graphql):
    recurring_reservation_1 = RecurringReservationFactory.create(
        name="1",
        reservation_unit__reservation_unit_type__name="foo",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        name="2",
        reservation_unit__reservation_unit_type__name="bar",
    )
    graphql.login_with_superuser()

    query = recurring_reservations_query(
        reservation_unit_type=[
            recurring_reservation_1.reservation_unit.reservation_unit_type.pk,
            recurring_reservation_2.reservation_unit.reservation_unit_type.pk,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}
