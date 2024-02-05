import pytest

from tests.factories import ReservationDenyReasonFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_deny_reasons__query(graphql):
    deny_reason = ReservationDenyReasonFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        reasonFi
        reasonEn
        reasonSv
    """
    query = build_query("reservationDenyReasons", fields=fields, connection=True)
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

    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    fields = """
        pk
        reasonFi
        reasonEn
        reasonSv
    """
    query = build_query("reservationDenyReasons", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.edges == []
