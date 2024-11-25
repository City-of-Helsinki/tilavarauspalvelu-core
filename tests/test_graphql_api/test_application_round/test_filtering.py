from __future__ import annotations

import pytest

from tests.factories import ApplicationRoundFactory, ReservationUnitFactory, UserFactory
from tests.test_graphql_api.test_application_round.helpers import rounds_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round__filter__by_pk(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create()
    ApplicationRoundFactory.create()
    graphql.login_with_superuser()

    # when:
    # - The user queries application rounds with the specific pk
    response = graphql(rounds_query(pk=application_round.pk))

    # then:
    # - The response contains only the filtered application round
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_application_round__filter__by_pk__multiple(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round_1 = ApplicationRoundFactory.create()
    application_round_2 = ApplicationRoundFactory.create()
    graphql.login_with_superuser()

    # when:
    # - The user queries application rounds with any of the specific pks
    response = graphql(rounds_query(pk=[application_round_1.pk, application_round_2.pk]))

    # then:
    # - The response contains the filtered application rounds
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": application_round_1.pk}
    assert response.node(1) == {"pk": application_round_2.pk}


def test_application_round__filter__by_active(graphql):
    ApplicationRoundFactory.create_in_status_upcoming()
    application_round = ApplicationRoundFactory.create_in_status_open()
    ApplicationRoundFactory.create_in_status_in_allocation()

    graphql.login_with_superuser()
    query = rounds_query(active=True)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_application_round__filter__by_active__negative(graphql):
    application_round_1 = ApplicationRoundFactory.create_in_status_upcoming()
    ApplicationRoundFactory.create_in_status_open()
    application_round_2 = ApplicationRoundFactory.create_in_status_in_allocation()

    graphql.login_with_superuser()
    query = rounds_query(active=False)
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": application_round_1.pk}
    assert response.node(1) == {"pk": application_round_2.pk}


def test_application_round__filter__by_ongoing(graphql):
    application_round_1 = ApplicationRoundFactory.create_in_status_upcoming()
    application_round_2 = ApplicationRoundFactory.create_in_status_open()
    ApplicationRoundFactory.create_in_status_results_sent()

    graphql.login_with_superuser()
    query = rounds_query(ongoing=True)
    response = graphql(query)

    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": application_round_1.pk}
    assert response.node(1) == {"pk": application_round_2.pk}


def test_application_round__filter__by_ongoing__negative(graphql):
    ApplicationRoundFactory.create_in_status_upcoming()
    ApplicationRoundFactory.create_in_status_open()
    application_round = ApplicationRoundFactory.create_in_status_results_sent()

    graphql.login_with_superuser()
    query = rounds_query(ongoing=False)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_application_round__filter__by_only_with_permissions__superuser(graphql):
    application_round = ApplicationRoundFactory.create()

    graphql.login_with_superuser()
    query = rounds_query(only_with_permissions=True)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_application_round__filter__by_only_with_permissions__anonymous_user(graphql):
    ApplicationRoundFactory.create()

    query = rounds_query(only_with_permissions=True)
    response = graphql(query)

    assert len(response.edges) == 0, response


def test_application_round__filter__by_only_with_permissions__regular_user(graphql):
    ApplicationRoundFactory.create()

    graphql.login_with_regular_user()
    query = rounds_query(only_with_permissions=True)
    response = graphql(query)

    assert len(response.edges) == 0, response


def test_application_round__filter__by_only_with_permissions__general_admin(graphql):
    application_round = ApplicationRoundFactory.create()

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    query = rounds_query(only_with_permissions=True)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_application_round__filter__by_only_with_permissions__unit_admin(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create(reservation_units=[reservation_unit_1])
    ApplicationRoundFactory.create(reservation_units=[reservation_unit_2])

    unit = reservation_unit_1.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    query = rounds_query(only_with_permissions=True)
    response = graphql(query)

    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}
