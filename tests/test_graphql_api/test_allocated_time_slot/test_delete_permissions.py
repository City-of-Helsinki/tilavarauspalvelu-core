import pytest

from tests.factories import ApplicationFactory, ServiceSectorFactory, UserFactory

from .helpers import DELETE_ALLOCATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__delete__application_owner(graphql):
    # given:
    # - There is an allocated application
    # - The application owner is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    slot = option.allocated_time_slots.first()
    graphql.force_login(application.user)

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - The error complains about permissions
    assert response.error_message() == "No permission to delete."


def test_allocated_time_slot__delete__service_sector_admin(graphql):
    # given:
    # - There is an allocated application
    # - A service sector admin is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    slot = option.allocated_time_slots.first()

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=application.application_round.service_sector,
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - There are no errors in the response
    assert response.has_errors is False, response


def test_allocated_time_slot__delete__service_sector_admin__for_other_sector(graphql):
    # given:
    # - There is an allocated application
    # - A service sector admin for some other sector is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    slot = option.allocated_time_slots.first()

    admin = UserFactory.create_with_service_sector_permissions(
        service_sector=ServiceSectorFactory.create(),
        perms=["can_handle_applications"],
    )
    graphql.force_login(admin)

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - The error complains about permissions
    assert response.error_message() == "No permission to delete."
