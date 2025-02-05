from __future__ import annotations

from contextlib import contextmanager
from unittest.mock import patch

import pytest

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice

from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.test_graphql_api.test_application_round.helpers import SET_RESULTS_SENT_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@contextmanager
def mock_send_application_handled_email_task():
    path = "tilavarauspalvelu.api.graphql.types.application_round.serializers.send_application_handled_email_task.delay"
    with patch(path) as mock:
        yield mock


def test_application_round__set_results_sent(graphql):
    application_round = ApplicationRoundFactory.create_in_status_handled()
    ApplicationFactory.create_in_status_handled(application_round=application_round)

    data = {"pk": application_round.pk}

    graphql.login_with_superuser()

    with mock_send_application_handled_email_task() as mock:
        response = graphql(SET_RESULTS_SENT_MUTATION, input_data=data)

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
        response = graphql(SET_RESULTS_SENT_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not in handled status."]

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    assert mock.call_count == 0
