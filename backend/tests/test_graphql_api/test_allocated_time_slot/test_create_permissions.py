import pytest

from tests.factories import ApplicationFactory

from .helpers import CREATE_ALLOCATION, allocation_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__create__applicant(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - The application owner is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    graphql.force_login(application.user)

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The error complains about permissions
    assert response.error_message() == "No permission to create."
