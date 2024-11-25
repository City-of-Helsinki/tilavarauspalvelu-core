from __future__ import annotations

import uuid

import pytest

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory, UserFactory

from .helpers import order_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_order__query__unauthenticated_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    query = order_query(order_uuid=order.remote_id)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object is None


def test_order__query__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    graphql.login_with_regular_user()

    query = order_query(order_uuid=order.remote_id)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object is None


def test_order__query__general_admin__can_manage_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    query = order_query(order_uuid=order.remote_id)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object is not None


def test_order__query__unit_admin__can_manage_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_units=[reservation_unit])
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    query = order_query(order_uuid=order.remote_id)
    response = graphql(query)

    assert response.has_errors is False
    assert response.first_query_object is not None
