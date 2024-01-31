from functools import partial

import pytest

from tests.factories import ReservationPurposeFactory
from tests.gql_builders import build_query
from tests.helpers import UserType

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

reservation_purposes_query = partial(build_query, "reservationPurposes", connection=True, order_by="pk")


def test_reservation_purpose__query__all_fields(graphql):
    # given:
    # - There are two reservation purposes in the database
    # - A superuser is using the system
    purpose_1 = ReservationPurposeFactory(name_fi="foo_fi", name_sv="foo_sv", name_en="foo_en")
    purpose_2 = ReservationPurposeFactory(name_fi="bar_fi", name_sv="bar_sv", name_en="bar_en")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries for reservation purposes with all fields
    fields = """
        pk
        nameFi
        nameSv
        nameEn
    """
    response = graphql(reservation_purposes_query(fields=fields))

    # then:
    # - The response contains no errors
    # - The response contains the two reservation purposes
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": purpose_1.pk,
        "nameFi": purpose_1.name_fi,
        "nameSv": purpose_1.name_sv,
        "nameEn": purpose_1.name_en,
    }
    assert response.node(1) == {
        "pk": purpose_2.pk,
        "nameFi": purpose_2.name_fi,
        "nameSv": purpose_2.name_sv,
        "nameEn": purpose_2.name_en,
    }


def test_reservation_purpose__filter__by_pk(graphql):
    # given:
    # - There are two reservation purposes in the database
    # - Regular user is using the system
    purpose_1 = ReservationPurposeFactory()
    ReservationPurposeFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation purposes with a specific pk
    response = graphql(reservation_purposes_query(pk=purpose_1.pk))

    # then:
    # - The response contains no errors
    # - The response contains only the selected reservation purpose
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": purpose_1.pk}


def test_reservation_purpose__filter__by_pk__multiple(graphql):
    # given:
    # - There are two reservation purposes in the database
    # - Regular user is using the system
    purpose_1 = ReservationPurposeFactory()
    purpose_2 = ReservationPurposeFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation purposes with specific pks
    response = graphql(reservation_purposes_query(pk=[purpose_1.pk, purpose_2.pk]))

    # then:
    # - The response contains no errors
    # - The response contains both reservation purposes
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": purpose_1.pk}
    assert response.node(1) == {"pk": purpose_2.pk}


def test_reservation_purpose__filter__by_name(graphql):
    # given:
    # - There are two reservation purposes with different names in the database
    # - Regular user is using the system
    purpose_1 = ReservationPurposeFactory(name="foo")
    ReservationPurposeFactory(name="bar")
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation purposes with a specific name
    response = graphql(reservation_purposes_query(name=purpose_1.name))

    # then:
    # - The response contains no errors
    # - The response contains only the selected reservation purpose
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": purpose_1.pk}


def test_reservation_purpose__query__regular_user(graphql):
    # given:
    # - There are two reservation purposes in the database
    # - Regular user is using the system
    purpose_1 = ReservationPurposeFactory()
    purpose_2 = ReservationPurposeFactory()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - The user queries for reservation purposes
    response = graphql(reservation_purposes_query())

    # then:
    # - The response contains no errors
    # - The response contains the two reservation purposes
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": purpose_1.pk}
    assert response.node(1) == {"pk": purpose_2.pk}


def test_reservation_purpose__query__anonymized(graphql):
    # given:
    # - There are two reservation purposes in the database
    # - An anonymized user is using the system
    purpose_1 = ReservationPurposeFactory()
    purpose_2 = ReservationPurposeFactory()
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    # when:
    # - The user queries for reservation purposes
    response = graphql(reservation_purposes_query())

    # then:
    # - The response contains no errors
    # - The response contains the two reservation purposes
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": purpose_1.pk}
    assert response.node(1) == {"pk": purpose_2.pk}
