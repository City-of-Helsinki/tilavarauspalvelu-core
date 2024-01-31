from functools import partial

import pytest

from tests.factories import ReservationCancelReasonFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

cancel_reason_query = partial(build_query, "reservationCancelReasons", connection=True, order_by="pk")


def test_reservation_cancel_reason__query__all_fields(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - A superuser is using the system
    reason_1 = ReservationCancelReasonFactory(reason_fi="foo_fi", reason_sv="foo_sv", reason_en="foo_en")
    reason_2 = ReservationCancelReasonFactory(reason_fi="bar_fi", reason_sv="bar_sv", reason_en="bar_en")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for reservation cancel reasons with all fields
    fields = """
        pk
        reasonFi
        reasonSv
        reasonEn
    """
    response = graphql(cancel_reason_query(fields=fields))

    # then:
    # - The response contains no errors
    # - The response contains the two reservation cancel reasons
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": reason_1.pk,
        "reasonFi": reason_1.reason_fi,
        "reasonSv": reason_1.reason_sv,
        "reasonEn": reason_1.reason_en,
    }
    assert response.node(1) == {
        "pk": reason_2.pk,
        "reasonFi": reason_2.reason_fi,
        "reasonSv": reason_2.reason_sv,
        "reasonEn": reason_2.reason_en,
    }


def test_reservation_cancel_reason__filter__by_pk(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - Regular user is using the system
    reason_1 = ReservationCancelReasonFactory()
    ReservationCancelReasonFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation cancel reasons with a specific pk
    response = graphql(cancel_reason_query(pk=reason_1.pk))

    # then:
    # - The response contains no errors
    # - The response contains only the selected reservation cancel reason
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reason_1.pk}


def test_reservation_cancel_reason__filter__by_pk__multiple(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - Regular user is using the system
    reason_1 = ReservationCancelReasonFactory()
    reason_2 = ReservationCancelReasonFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation cancel reasons with specific pks
    response = graphql(cancel_reason_query(pk=[reason_1.pk, reason_2.pk]))

    # then:
    # - The response contains no errors
    # - The response contains both reservation cancel reasons
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reason_1.pk}
    assert response.node(1) == {"pk": reason_2.pk}


def test_reservation_cancel_reason__filter__by_reason(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - Regular user is using the system
    reason_1 = ReservationCancelReasonFactory(reason="foo")
    ReservationCancelReasonFactory(reason="bar")
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation cancel reasons with a specific reason
    response = graphql(cancel_reason_query(reason=reason_1.reason))

    # then:
    # - The response contains no errors
    # - The response contains only the selected reservation cancel reason
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reason_1.pk}


def test_reservation_cancel_reason__query__regular_user(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - Regular user is using the system
    reason_1 = ReservationCancelReasonFactory()
    reason_2 = ReservationCancelReasonFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation cancel reasons
    response = graphql(cancel_reason_query())

    # then:
    # - The response contains no errors
    # - The response contains the two reservation cancel reasons
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reason_1.pk}
    assert response.node(1) == {"pk": reason_2.pk}


def test_reservation_cancel_reason__query__anonymized(graphql):
    # given:
    # - There are two reservation cancel reasons in the database
    # - An anonymized user is using the system
    ReservationCancelReasonFactory()
    ReservationCancelReasonFactory()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - The user queries for reservation cancel reasons
    response = graphql(cancel_reason_query())

    # then:
    # - The response contains no errors about permissions
    assert response.error_message() == "You do not have permission to access this node.", response
