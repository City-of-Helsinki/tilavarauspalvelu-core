import pytest

from tilavarauspalvelu.enums import Weekday

from tests.factories import ApplicationSectionFactory, ReservationUnitOptionFactory, UserFactory

from .helpers import REJECT_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__reject_all_options(graphql):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation()
    option = application_section.reservation_unit_options.first()
    assert option.rejected is False

    graphql.login_with_superuser()
    response = graphql(REJECT_MUTATION, input_data={"pk": application_section.pk})

    assert response.has_errors is False, response

    option.refresh_from_db()
    assert option.rejected is True


def test_application_section__reject_all_options__has_allocations(graphql):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation(
        reservation_unit_options__rejected=False,
        reservation_unit_options__allocated_time_slots__day_of_the_week=Weekday.MONDAY,
    )
    option = application_section.reservation_unit_options.first()
    assert option.rejected is False
    assert option.allocated_time_slots.exists()

    graphql.login_with_superuser()
    response = graphql(REJECT_MUTATION, input_data={"pk": application_section.pk})

    assert response.error_message() == "Mutation was unsuccessful.", response
    assert response.field_error_messages() == [
        "Application section has allocated time slots and cannot be rejected.",
    ]


def test_application_section__reject_all_options__general_admin(graphql):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation()

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": application_section.pk})

    assert response.has_errors is False


def test_application_section__reject_all_options__unit_admin(graphql):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation()

    unit = application_section.reservation_unit_options.first().reservation_unit.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": application_section.pk})

    assert response.has_errors is False


def test_application_section__reject_all_options__unit_admin__no_permission_for_all_units(graphql):
    section = ApplicationSectionFactory.create_in_status_in_allocation()

    ReservationUnitOptionFactory.create(application_section=section)

    unit = section.reservation_unit_options.first().reservation_unit.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": section.pk})

    assert response.error_message() == "No permission to update."


def test_application_section__reject_all_options__unit_admin__has_permission_for_all_units(graphql):
    section = ApplicationSectionFactory.create_in_status_in_allocation()

    option_1 = section.reservation_unit_options.first()
    option_2 = ReservationUnitOptionFactory.create(application_section=section)

    unit_1 = option_1.reservation_unit.unit
    unit_2 = option_2.reservation_unit.unit

    admin = UserFactory.create_with_unit_role(units=[unit_1, unit_2])
    graphql.force_login(admin)

    response = graphql(REJECT_MUTATION, input_data={"pk": section.pk})

    assert response.has_errors is False, response.errors
