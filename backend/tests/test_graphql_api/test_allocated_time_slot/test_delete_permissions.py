from __future__ import annotations

import pytest

from tests.factories import ApplicationFactory

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
