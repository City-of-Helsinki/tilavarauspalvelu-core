from __future__ import annotations

import freezegun
import pytest

from tilavarauspalvelu.models import Application, ApplicationSection, ReservationUnitOption, SuitableTimeRange
from utils.date_utils import local_date, local_datetime

from tests.factories import ApplicationRoundFactory, UserFactory
from tests.test_graphql_api.test_application.helpers import get_application_create_data

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__create(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response

    assert Application.objects.count() == 1


def test_application__create__with_application_sections(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    assert Application.objects.count() == 0

    input_data = get_application_create_data(application_round, create_sections=True)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response

    assert Application.objects.count() == 1
    assert ApplicationSection.objects.count() == 1
    assert SuitableTimeRange.objects.count() == 1
    assert ReservationUnitOption.objects.count() == 1


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_application__create__is_under_age(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 2))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "User is not of age"


@pytest.mark.parametrize("email", ["test@hel.fi", "test@edu.hel.fi"])
def test_application__create__is_ad_user(graphql, email):
    application_round = ApplicationRoundFactory.create_in_status_open()

    user = UserFactory.create_ad_user(
        is_superuser=True,
        date_of_birth=local_datetime(2006, 1, 1),
        email=email,
    )

    graphql.force_login(user)

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response


def test_application__create__is_ad_user__not_internal_user(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()

    user = UserFactory.create_ad_user(
        date_of_birth=local_datetime(2006, 1, 1),
        email="test@example.com",
    )

    graphql.force_login(user)

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "AD user is not an internal user."


def test_application__create__is_ad_user__not_internal_user__is_superuser(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()

    user = UserFactory.create_ad_user(
        is_superuser=True,
        date_of_birth=local_datetime(2006, 1, 1),
        email="test@example.com",
    )

    graphql.force_login(user)

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response


def test_application__create__sent_at(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    input_data["sentAt"] = local_date().isoformat()

    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    # Sent date cannot be updated, must use specific mutation for it.
    assert response.has_errors is True, response


def test_application__create__before_application_period(graphql):
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Application round is not open for applications"


def test_application__create__after_application_period(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Application round is not open for applications"
