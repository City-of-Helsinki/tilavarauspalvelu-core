import pytest

from applications.choices import Weekday
from tests.factories import ApplicationFactory, UserFactory

from .helpers import REJECT_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application__reject_all_options(graphql):
    application = ApplicationFactory.create_in_status_in_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    assert option.rejected is False

    graphql.login_with_superuser()
    response = graphql(REJECT_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False, response

    option.refresh_from_db()
    assert option.rejected is True


def test_application__reject_all_options__has_allocations(graphql):
    application = ApplicationFactory.create_in_status_in_allocation(
        application_sections__reservation_unit_options__rejected=False,
        application_sections__reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    assert option.rejected is False
    assert option.allocated_time_slots.exists()

    graphql.login_with_superuser()
    response = graphql(REJECT_MUTATION, input_data={"pk": application.pk})

    assert response.error_message() == "Mutation was unsuccessful.", response
    assert response.field_error_messages() == [
        "Application has allocated time slots and cannot be rejected.",
    ]


def test_application__reject_all_options__general_admin(graphql):
    application = ApplicationFactory.create_in_status_in_allocation()

    admin = UserFactory.create_with_general_permissions(perms=["can_handle_applications"])
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False


def test_application__reject_all_options__unit_admin(graphql):
    application = ApplicationFactory.create_in_status_in_allocation()

    section = application.application_sections.first()
    unit = section.reservation_unit_options.first().reservation_unit.unit
    admin = UserFactory.create_with_unit_permissions(unit=unit, perms=["can_handle_applications"])
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": application.pk})

    assert response.has_errors is False
