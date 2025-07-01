from __future__ import annotations

import freezegun
import pytest

from tilavarauspalvelu.models import (
    Address,
    Application,
    ApplicationSection,
    Organisation,
    Person,
    ReservationUnitOption,
    SuitableTimeRange,
)
from utils.date_utils import local_date, local_datetime

from tests.factories import ApplicationRoundFactory, UserFactory
from tests.test_graphql_api.test_application.helpers import get_application_create_data

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__create(graphql):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    # when:
    # - User tries to create a new application without sections
    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - An application is created
    # - An organisation is created for the application
    # - An address is created for the organisation
    # - A contact person is created for the application
    # - A billing address is created for the application
    # - No application events are created
    assert response.has_errors is False, response
    assert Application.objects.count() == 1
    assert Organisation.objects.count() == 1
    assert Person.objects.count() == 1  # contact person
    assert Address.objects.count() == 2  # billing and organisation addresses


def test_application__create__with_application_sections(graphql):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    assert Application.objects.count() == 0

    # when:
    # - User tries to create a new application without events
    input_data = get_application_create_data(application_round, create_sections=True)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains no errors
    # - An application is created
    # - An organisation is created for the application
    # - An address is created for the organisation
    # - A contact person is created for the application
    # - A billing address is created for the application
    # - An application section is created for the application
    # - A suitable time range is created for the application section
    # - An reservation unit option is created for the application section
    assert response.has_errors is False, response
    assert Application.objects.count() == 1
    assert Organisation.objects.count() == 1
    assert Person.objects.count() == 1  # contact person
    assert Address.objects.count() == 2  # billing and organisation addresses
    assert ApplicationSection.objects.count() == 1
    assert SuitableTimeRange.objects.count() == 1
    assert ReservationUnitOption.objects.count() == 1


def test_application__create__with_application_sections__too_many(graphql, settings):
    settings.MAXIMUM_SECTIONS_PER_APPLICATION = 0

    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    assert Application.objects.count() == 0

    input_data = get_application_create_data(application_round, create_sections=True)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Cannot create more than 0 application sections in one application",
    ]


@pytest.mark.parametrize("field", ["city", "postCode", "streetAddress"])
def test_application__create__sub_serializer_error(graphql, field):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    address_data = {
        "streetAddress": "Address",
        "city": "City",
        "postCode": "12345",
    }
    address_data[field] = ""
    input_data = {
        "applicationRound": application_round.pk,
        "billingAddress": address_data,
    }

    # when:
    # - User tries to create a new application with improper address data
    response = graphql(CREATE_MUTATION, input_data=input_data)

    # then:
    # - The response contains errors from sub serializers
    assert response.field_errors == [
        {
            "code": "blank",
            "field": f"billingAddress.{field}",
            "message": "This field may not be blank.",
        }
    ]


@freezegun.freeze_time(local_datetime(2024, 1, 1))
def test_application__create__is_under_age(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 2))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["User is not of age"]


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
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response


def test_application__create__is_ad_user__not_internal_user(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()

    user = UserFactory.create_ad_user(
        date_of_birth=local_datetime(2006, 1, 1),
        email="test@example.com",
    )

    graphql.force_login(user)

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["AD user is not an internal user."]


def test_application__create__is_ad_user__not_internal_user__is_superuser(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()

    user = UserFactory.create_ad_user(
        is_superuser=True,
        date_of_birth=local_datetime(2006, 1, 1),
        email="test@example.com",
    )

    graphql.force_login(user)

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response


def test_application__create__sent_at(graphql):
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    input_data["sentAt"] = local_date().isoformat()

    response = graphql(CREATE_MUTATION, input_data=input_data)

    # Sent date cannot be updated, must use specific mutation for it.
    assert response.has_schema_errors is True, response


def test_application__create__before_application_period(graphql):
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not open for applications"]


def test_application__create__after_application_period(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    graphql.login_with_superuser(date_of_birth=local_datetime(2006, 1, 1))

    input_data = get_application_create_data(application_round)
    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not open for applications"]
