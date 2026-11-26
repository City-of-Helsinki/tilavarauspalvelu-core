from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import ApplicationFactory

from .helpers import DELETE_ALLOCATION

if TYPE_CHECKING:
    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__delete__application_owner(graphql: GraphQLClient) -> None:
    # given:
    # - There is an allocated application
    # - The application owner is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        times_slots_to_create=1,
        pre_allocated=True,
    )
    section = application.application_sections.get()
    option = section.reservation_unit_options.get()
    slot = option.allocated_time_slots.get()
    graphql.force_login(application.user)

    # when:
    # - User tries to delete an allocated time slot
    response = graphql(DELETE_ALLOCATION, input_data={"pk": slot.pk})

    # then:
    # - The error complains about permissions
    assert response.error_message() == "No permission to delete."
