from __future__ import annotations

import datetime

import pytest
from django.utils import timezone

from tilavarauspalvelu.enums import CustomerTypeChoice, OrderStatus

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory
from tests.test_graphql_api.test_reservation.helpers import reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_reservation__order__by_reservation_unit_name__asc(graphql, lang):
    res_unit_a = ReservationUnitFactory.create(**{f"name_{lang}": "A Unit"})
    res_unit_b = ReservationUnitFactory.create(**{f"name_{lang}": "B Unit"})
    res_unit_c = ReservationUnitFactory.create(**{f"name_{lang}": "C Unit"})

    reservation_1 = ReservationFactory.create(reservation_units=[res_unit_a])
    reservation_2 = ReservationFactory.create(reservation_units=[res_unit_b])
    reservation_3 = ReservationFactory.create(reservation_units=[res_unit_c])

    graphql.login_with_superuser()
    query = reservations_query(order_by=f"reservationUnitName{lang.capitalize()}Asc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_reservation__order__by_reservation_unit_name__desc(graphql, lang):
    res_unit_a = ReservationUnitFactory.create(**{f"name_{lang}": "A Unit"})
    res_unit_b = ReservationUnitFactory.create(**{f"name_{lang}": "B Unit"})
    res_unit_c = ReservationUnitFactory.create(**{f"name_{lang}": "C Unit"})

    reservation_1 = ReservationFactory.create(reservation_units=[res_unit_a])
    reservation_2 = ReservationFactory.create(reservation_units=[res_unit_b])
    reservation_3 = ReservationFactory.create(reservation_units=[res_unit_c])

    graphql.login_with_superuser()
    query = reservations_query(order_by=f"reservationUnitName{lang.capitalize()}Desc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_3.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_1.pk}


def test_reservation__order__by_reservee_name__asc(graphql):
    reservation_1 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="A",
    )
    reservation_2 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="B",
    )
    reservation_3 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="C",
    )

    graphql.login_with_superuser()
    query = reservations_query(order_by="reserveeNameAsc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}


def test_reservation__order__by_reservee_name__desc(graphql):
    reservation_1 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="A",
    )
    reservation_2 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="B",
    )
    reservation_3 = ReservationFactory.create(
        reservee_type=CustomerTypeChoice.BUSINESS,
        reservee_organisation_name="C",
    )

    graphql.login_with_superuser()
    query = reservations_query(order_by="reserveeNameDesc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_3.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_reservation__order__by_unit_name__asc(graphql, lang):
    res_unit_a = ReservationUnitFactory.create(**{f"unit__name_{lang}": "A Unit"})
    res_unit_b = ReservationUnitFactory.create(**{f"unit__name_{lang}": "B Unit"})
    res_unit_c = ReservationUnitFactory.create(**{f"unit__name_{lang}": "C Unit"})

    reservation_1 = ReservationFactory.create(reservation_units=[res_unit_a])
    reservation_2 = ReservationFactory.create(reservation_units=[res_unit_b])
    reservation_3 = ReservationFactory.create(reservation_units=[res_unit_c])

    graphql.login_with_superuser()
    query = reservations_query(order_by=f"unitName{lang.capitalize()}Asc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_reservation__order__by_unit_name__desc(graphql, lang):
    res_unit_a = ReservationUnitFactory.create(**{f"unit__name_{lang}": "A Unit"})
    res_unit_b = ReservationUnitFactory.create(**{f"unit__name_{lang}": "B Unit"})
    res_unit_c = ReservationUnitFactory.create(**{f"unit__name_{lang}": "C Unit"})

    reservation_1 = ReservationFactory.create(reservation_units=[res_unit_a])
    reservation_2 = ReservationFactory.create(reservation_units=[res_unit_b])
    reservation_3 = ReservationFactory.create(reservation_units=[res_unit_c])

    graphql.login_with_superuser()
    query = reservations_query(order_by=f"unitName{lang.capitalize()}Desc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_3.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_1.pk}


def test_reservation__order__by_created_at(graphql):
    now = timezone.localtime()
    reservation_1 = ReservationFactory.create(created_at=now + datetime.timedelta(hours=-3))
    reservation_2 = ReservationFactory.create(created_at=now + datetime.timedelta(hours=-2))
    reservation_3 = ReservationFactory.create(created_at=now + datetime.timedelta(hours=-1))

    graphql.login_with_superuser()
    query = reservations_query(order_by="createdAtAsc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}


def test_reservation__order__by_order_status(graphql):
    reservation_1 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.CANCELLED, reservation=reservation_1)

    reservation_2 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.DRAFT, reservation=reservation_2)

    reservation_3 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.EXPIRED, reservation=reservation_3)

    reservation_4 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.PAID, reservation=reservation_4)

    reservation_5 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.PAID_MANUALLY, reservation=reservation_5)

    reservation_6 = ReservationFactory.create()
    PaymentOrderFactory.create(status=OrderStatus.REFUNDED, reservation=reservation_6)

    graphql.login_with_superuser()
    query = reservations_query(order_by="orderStatusAsc")
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 6
    assert response.node(0) == {"pk": reservation_1.pk}
    assert response.node(1) == {"pk": reservation_2.pk}
    assert response.node(2) == {"pk": reservation_3.pk}
    assert response.node(3) == {"pk": reservation_4.pk}
    assert response.node(4) == {"pk": reservation_5.pk}
    assert response.node(5) == {"pk": reservation_6.pk}
