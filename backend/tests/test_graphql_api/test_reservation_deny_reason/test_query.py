from __future__ import annotations

from functools import partial

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationDenyReasonFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


deny_query = partial(build_query, "reservationDenyReasons", connection=True)


def test_reservation_deny_reasons__query(graphql):
    deny_reason = ReservationDenyReasonFactory.create()

    graphql.login_with_superuser()

    query = deny_query(fields="pk reasonFi reasonEn reasonSv")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": deny_reason.pk,
        "reasonFi": deny_reason.reason_fi,
        "reasonEn": deny_reason.reason_en,
        "reasonSv": deny_reason.reason_sv,
    }


def test_reservation_deny_reasons__query__anonymous_user(graphql):
    ReservationDenyReasonFactory.create()

    query = deny_query()
    response = graphql(query)

    assert response.error_message() == "No permission to access node."


def test_reservation_deny_reasons__order__by_rank(graphql):
    deny_reason_1 = ReservationDenyReasonFactory.create(rank=1)
    deny_reason_2 = ReservationDenyReasonFactory.create(rank=3)
    deny_reason_3 = ReservationDenyReasonFactory.create(rank=2)

    graphql.login_with_superuser()

    query = deny_query(order_by="rankAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": deny_reason_1.pk}
    assert response.node(1) == {"pk": deny_reason_3.pk}
    assert response.node(2) == {"pk": deny_reason_2.pk}

    query = deny_query(order_by="rankDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": deny_reason_2.pk}
    assert response.node(1) == {"pk": deny_reason_3.pk}
    assert response.node(2) == {"pk": deny_reason_1.pk}
