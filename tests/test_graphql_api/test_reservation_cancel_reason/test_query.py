from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tests.factories import ReservationCancelReasonFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_cancel_reasons__query(graphql):
    cancel_reason = ReservationCancelReasonFactory.create()

    graphql.login_with_superuser()

    fields = """
        pk
        reasonFi
        reasonEn
        reasonSv
    """
    query = build_query("reservationCancelReasons", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": cancel_reason.pk,
        "reasonFi": cancel_reason.reason_fi,
        "reasonEn": cancel_reason.reason_en,
        "reasonSv": cancel_reason.reason_sv,
    }


def test_reservation_cancel_reasons__query__anonymous_user(graphql):
    ReservationCancelReasonFactory.create()

    fields = """
        pk
        reasonFi
        reasonEn
        reasonSv
    """
    query = build_query("reservationCancelReasons", fields=fields, connection=True)
    response = graphql(query)

    assert response.error_message() == "No permission to access node."
