import pytest

from tests.factories import ApplicationRoundFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_round.helpers import rounds_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_can_filter_application_rounds__by_pk(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create()
    ApplicationRoundFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries application rounds with the specific pk
    response = graphql(rounds_query(pk=application_round.pk))

    # then:
    # - The response contains only the filtered application round
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": application_round.pk}


def test_can_filter_application_rounds__by_pk__multiple(graphql):
    # given:
    # - There are two application rounds
    # - A superuser is using the system
    application_round_1 = ApplicationRoundFactory.create()
    application_round_2 = ApplicationRoundFactory.create()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user queries application rounds with any of the specific pks
    response = graphql(rounds_query(pk=[application_round_1.pk, application_round_2.pk]))

    # then:
    # - The response contains the filtered application rounds
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": application_round_1.pk}
    assert response.node(1) == {"pk": application_round_2.pk}
