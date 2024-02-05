import pytest

from tests.factories import ReservationCancelReasonFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_cancel_reasons__query(graphql):
    cancel_reason = ReservationCancelReasonFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

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

    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    fields = """
        pk
        reasonFi
        reasonEn
        reasonSv
    """
    query = build_query("reservationCancelReasons", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.edges == []
