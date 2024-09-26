import pytest

from tests.factories import ApplicationRoundFactory
from tests.test_graphql_api.test_application.helpers import get_application_create_data
from tilavarauspalvelu.models import (
    Address,
    Application,
    ApplicationSection,
    Organisation,
    Person,
    ReservationUnitOption,
    SuitableTimeRange,
)

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
    graphql.login_with_superuser()

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
    graphql.login_with_superuser()

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


@pytest.mark.parametrize("field", ["city", "postCode", "streetAddress"])
def test_application__create__sub_serializer_error(graphql, field):
    # given:
    # - There is an open application round
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_open()
    graphql.login_with_superuser()

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
