import pytest

from tests.factories import ReservationUnitCancellationRuleFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_cancellation_rules__query(graphql):
    rules = ReservationUnitCancellationRuleFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    query = build_query("reservationUnitCancellationRules", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 1
    assert response.node() == {
        "pk": rules.pk,
        "nameFi": rules.name_fi,
        "nameSv": rules.name_en,
        "nameEn": rules.name_sv,
    }


def test_reservation_unit_cancellation_rules__query__anonymous_user(graphql):
    ReservationUnitCancellationRuleFactory.create()

    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    query = build_query("reservationUnitCancellationRules", fields=fields, connection=True)
    response = graphql(query)

    assert response.has_errors is False
    assert response.edges == []
