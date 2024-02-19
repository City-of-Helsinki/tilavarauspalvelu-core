import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import (
    ApplicationFactory,
    ServiceSectorFactory,
    UserFactory,
)

from .helpers import CREATE_ALLOCATION, allocation_create_data

DEFAULT_TIMEZONE = get_default_timezone()

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


def test_allocated_time_slot__create__service_sector_admin(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A service sector admin is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    assert response.has_errors is False, response


def test_allocated_time_slot__create__service_sector_admin__for_other_sector(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A service sector admin for some other sector is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The error complains about permissions
    assert response.error_message() == "No permission to create."
