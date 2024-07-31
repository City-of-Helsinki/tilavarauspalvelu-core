import pytest

from applications.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice
from tests.factories import ApplicationFactory, ApplicationRoundFactory
from tests.helpers import UserType

from .helpers import DELETE_ALLOCATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_delete_allocated_time_slot(graphql):
    # given:
    # - There is an allocated application
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    slot = option.allocated_time_slots.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert section.status == ApplicationStatusChoice.HANDLED

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - There are no errors in the response
    # - The allocated time slot is deleted
    # - The application section is back to IN_ALLOCATION status
    assert response.has_errors is False, response

    option.refresh_from_db()
    assert option.allocated_time_slots.count() == 0

    assert section.status == ApplicationStatusChoice.IN_ALLOCATION


@pytest.mark.parametrize(
    "round_status",
    [
        ApplicationRoundStatusChoice.UPCOMING,
        ApplicationRoundStatusChoice.OPEN,
        ApplicationRoundStatusChoice.HANDLED,
        ApplicationRoundStatusChoice.RESULTS_SENT,
    ],
)
def test_allocated_time_slot__delete__blocked_due_to_round_status(graphql, round_status):
    # given:
    # - There is an allocated application, in an application round with different statuses
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status(status=round_status)
    application = ApplicationFactory.create_application_ready_for_allocation(
        application_round=application_round,
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    slot = option.allocated_time_slots.first()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - The response complains about the status of the application round
    assert response.field_error_messages() == [
        "Cannot delete allocations from an application round not in the allocation stage.",
    ]
