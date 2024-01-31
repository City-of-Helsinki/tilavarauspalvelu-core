import pytest

from applications.choices import ApplicationStatusChoice
from applications.models import ApplicationEvent
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType

from .helpers import SEND_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_send_application(graphql):
    # given:
    # - There is a draft application in an open application round with a single application event
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains no errors
    # - The application has a send date
    assert response.has_errors is False, response
    application.refresh_from_db()
    assert application.sent_date is not None


def test_send_application__no_events(graphql):
    # given:
    # - There is a draft application without application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about missing application events
    assert response.has_errors is True
    assert response.field_error_messages("applicationEvents") == [
        "Application requires application events before it can be sent.",
    ]


@pytest.mark.parametrize("missing_field", ApplicationEvent.required_for_review)
def test_send_application__missing_data_in_event(graphql, missing_field):
    # given:
    # - There is a draft application with and application event with one missing field required for review
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event = ApplicationEventFactory.create(application=application, **{missing_field: None})
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about missing field on the application event
    assert response.has_errors is True
    assert response.field_error_messages("applicationEvents") == [
        f"Field '{missing_field}' is required for application event "
        f"'{event.name}' before the application can be sent."
    ]


def test_send_application__missing_contact_person(graphql):
    # given:
    # - There is a draft application without a contact person
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(contact_person=None)
    ApplicationEventFactory.create(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about missing contact person
    assert response.has_errors is True
    assert response.field_error_messages("contactPerson") == [
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
    application = ApplicationFactory.create_in_status(status)
    ApplicationEventFactory.create(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to send the application
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    # then:
    # - The response contains errors about the state of the application
    assert response.has_errors is True
    assert response.field_error_messages() == [
        f"Application in status '{status.value}' cannot be sent.",
    ]
