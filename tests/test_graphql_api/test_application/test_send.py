from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.integrations.email.main import EmailService

from tests.factories import ApplicationFactory
from tests.factories.application import ApplicationBuilder
from tests.helpers import patch_method

from .helpers import SEND_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_application_received_email)
def test_send_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_with_superuser()

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application has a send date
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.sent_date is not None

    assert EmailService.send_application_received_email.called is True


def test_send_application__no_sections(graphql):
    # given:
    # - There is a draft application without application sections
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.login_with_superuser()

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about missing application sections
    assert response.has_errors is True
    assert response.field_error_messages() == [
        "Application requires application sections before it can be sent.",
    ]


def test_send_application__missing_contact_person(graphql):
    # given:
    # - There is a draft application without a contact person
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(contact_person=None)
    graphql.login_with_superuser()

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about missing contact person
    assert response.has_errors is True
    assert response.field_error_messages() == [
        "Contact person is required for application before the it can be sent.",
    ]


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
def test_send_application__wrong_status(graphql, status):
    # given:
    # - There is a draft application in a certain status
    # - A superuser is using the system
    application = ApplicationBuilder().with_status(status).create()
    graphql.login_with_superuser()

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about the state of the application
    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application in status '{status.value}' cannot be sent.",
    ]
