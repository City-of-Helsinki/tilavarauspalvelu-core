from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice

from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.test_graphql_api.test_application_round.helpers import (
    SET_RESULTS_SENT_MUTATION,
    mock_send_application_handled_email_task,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_round__set_results_sent(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    data = {"pk": application_round.pk}

    graphql.login_with_superuser()

    with mock_send_application_handled_email_task() as mock:
        response = graphql(SET_RESULTS_SENT_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.RESULTS_SENT

    assert mock.call_count == 1


def test_application_round__set_results_sent__not_handled(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    data = {"pk": application_round.pk}

    graphql.login_with_superuser()

    with mock_send_application_handled_email_task() as mock:
        response = graphql(SET_RESULTS_SENT_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Application round is not in handled status."

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    assert mock.call_count == 0
