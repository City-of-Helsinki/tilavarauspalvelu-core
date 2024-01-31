import pytest

from applications.choices import ApplicationStatusChoice
from tests.factories import ApplicationFactory, ApplicationRoundFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reset_application_allocation():
    # given:
    # - There is a single handled application in an application round in allocation
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)

    # when:
    # - User tries to reset allocation on the application
    application.actions.reset_application_allocation()

    # then:
    # - The application is in allocation again
    application.refresh_from_db()
    assert application.status == ApplicationStatusChoice.IN_ALLOCATION


def test_reset_application_round_allocation():
    # given:
    # - There is a single handled application in an application round in allocation
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application_1 = ApplicationFactory.create_in_status_handled(application_round=application_round)
    application_2 = ApplicationFactory.create_in_status_handled(application_round=application_round)
    application_3 = ApplicationFactory.create_in_status_handled(application_round=application_round)

    # when:
    # - User tries to reset allocation on the application
    application_round.actions.reset_application_round_allocation()

    # then:
    # - The application is in allocation again
    application_1.refresh_from_db()
    assert application_1.status == ApplicationStatusChoice.IN_ALLOCATION
    application_2.refresh_from_db()
    assert application_2.status == ApplicationStatusChoice.IN_ALLOCATION
    application_3.refresh_from_db()
    assert application_3.status == ApplicationStatusChoice.IN_ALLOCATION
