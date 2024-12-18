from __future__ import annotations

import datetime

import pytest

from utils.date_utils import local_start_of_day

from tests.factories import ApplicationFactory, UnitFactory, UserFactory

from .helpers import SEND_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__send__regular_user(graphql):
    application = ApplicationFactory.create_application_ready_for_sending()

    graphql.login_with_regular_user()
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.error_message() == "No permission to update."


def test_application__send__regular_user__own_application(graphql):
    application = ApplicationFactory.create_application_ready_for_sending()

    graphql.force_login(application.user)
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response

    application.refresh_from_db()
    assert application.sent_date is not None


def test_application__send__regular_user__own_application__application_period_over(graphql):
    application = ApplicationFactory.create_application_ready_for_sending(
        application_round__application_period_begin=local_start_of_day() - datetime.timedelta(days=4),
        application_round__application_period_end=local_start_of_day() - datetime.timedelta(days=2),
    )

    graphql.force_login(application.user)
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.error_message() == "No permission to update."


def test_application__send__general_admin(graphql):
    application = ApplicationFactory.create_application_ready_for_sending()
    admin = UserFactory.create_with_general_role()

    graphql.force_login(admin)
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response


def test_application__update__unit_admin(graphql):
    unit = UnitFactory.create()
    application = ApplicationFactory.create_application_ready_for_sending(
        application_sections__reservation_unit_options__reservation_unit__unit=unit,
    )
    admin = UserFactory.create_with_unit_role(units=[unit])

    graphql.force_login(admin)
    response = graphql(SEND_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response
