from __future__ import annotations

from functools import partial

import pytest

from tests.factories import ReservationDenyReasonFactory
from tests.query_builder import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


deny_query = partial(build_query, "allReservationDenyReasons")


def test_reservation_deny_reasons__query(graphql):
    deny_reason = ReservationDenyReasonFactory.create()

    graphql.login_with_superuser()

    query = deny_query(fields="pk reasonFi reasonEn reasonSv")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 1
    assert response.results[0] == {
        "pk": deny_reason.pk,
        "reasonFi": deny_reason.reason_fi,
        "reasonEn": deny_reason.reason_en,
        "reasonSv": deny_reason.reason_sv,
    }


def test_reservation_deny_reasons__query__anonymous_user(graphql):
    ReservationDenyReasonFactory.create()

    query = deny_query()
    response = graphql(query)

    assert response.error_message(0) == "No permission to access reservation deny reason."


def test_reservation_deny_reasons__order__by_rank(graphql):
    deny_reason_1 = ReservationDenyReasonFactory.create(rank=1)
    deny_reason_2 = ReservationDenyReasonFactory.create(rank=3)
    deny_reason_3 = ReservationDenyReasonFactory.create(rank=2)

    graphql.login_with_superuser()

    query = deny_query(order_by="rankAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": deny_reason_1.pk}
    assert response.results[1] == {"pk": deny_reason_3.pk}
    assert response.results[2] == {"pk": deny_reason_2.pk}

    query = deny_query(order_by="rankDesc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.results) == 3
    assert response.results[0] == {"pk": deny_reason_2.pk}
    assert response.results[1] == {"pk": deny_reason_3.pk}
    assert response.results[2] == {"pk": deny_reason_1.pk}
