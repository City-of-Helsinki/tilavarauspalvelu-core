from __future__ import annotations

import uuid

import pytest

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory, UserFactory

from .helpers import ORDER_QUERY

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_order__query__unauthenticated_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.error_message(0) == "No permission to access this payment order."


def test_order__query__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    graphql.login_with_regular_user()

    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.error_message(0) == "No permission to access this payment order."


def test_order__query__general_admin__can_manage_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    user = UserFactory.create_with_general_role()
    graphql.force_login(user)

    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.has_errors is False
    assert response.results is not None


def test_order__query__unit_admin__can_manage_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=str(uuid.uuid4()))

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    response = graphql(ORDER_QUERY, variables={"orderUuid": order.remote_id})

    assert response.has_errors is False
    assert response.results is not None
