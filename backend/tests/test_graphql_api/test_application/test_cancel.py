from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationStatusChoice

from tests.factories import ApplicationFactory
from tests.factories.application import ApplicationBuilder

from .helpers import CANCEL_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_cancel_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application section
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application has a send date
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.cancelled_at is not None


@pytest.mark.parametrize(
    "status",
    [
        ApplicationStatusChoice.IN_ALLOCATION,
        ApplicationStatusChoice.HANDLED,
        ApplicationStatusChoice.RESULTS_SENT,
        ApplicationStatusChoice.EXPIRED,
        ApplicationStatusChoice.CANCELLED,
    ],
)
def test_cancel_application__wrong_status(graphql, status):
    # given:
    # - There is a draft application in a certain status
    # - A superuser is using the system
    application = ApplicationBuilder().with_status(status).create()
    graphql.login_with_superuser()

    # when:
    # - The user tries to cancel the application
    response = graphql(CANCEL_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about the state of the application
    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application in status '{status.value}' cannot be cancelled.",
    ]
