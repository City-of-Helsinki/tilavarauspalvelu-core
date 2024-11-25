from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ApplicationStatusChoice, UserRoleChoice

from tests.factories import AllocatedTimeSlotFactory, ApplicationFactory
from tests.test_graphql_api.test_application.helpers import applications_query

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__query__perms__admin_user(graphql):
    # given:
    # - There is an allocated time slot
    # - A staff user is using the system
    allocation = AllocatedTimeSlotFactory.create()
    graphql.login_user_with_role(role=UserRoleChoice.ADMIN)

    # when:
    # - User tries to access allocated time slots
    response = graphql(allocations_query())

    # then:
    # - The data is returned in the response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


@pytest.mark.parametrize(
    "status",
    [
        ApplicationStatusChoice.DRAFT,
        ApplicationStatusChoice.RECEIVED,
        ApplicationStatusChoice.IN_ALLOCATION,
        ApplicationStatusChoice.HANDLED,
        ApplicationStatusChoice.EXPIRED,
        ApplicationStatusChoice.CANCELLED,
    ],
)
def test_allocated_time_slot__query__perms__application_owner__hidden(graphql, status):
    application = ApplicationFactory.create_in_status(status=status)
    AllocatedTimeSlotFactory.create(reservation_unit_option__application_section__application=application)
    graphql.force_login(application.user)

    response = graphql(allocations_query())

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 0


def test_allocated_time_slot__query__perms__application_owner__shown(graphql):
    application = ApplicationFactory.create_in_status_results_sent()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    allocation = option.allocated_time_slots.first()
    graphql.force_login(application.user)

    response = graphql(allocations_query())

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__query__perms__application_owner__through_application(graphql):
    application = ApplicationFactory.create_in_status_handled()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    allocation = option.allocated_time_slots.first()

    assert allocation is not None

    graphql.force_login(application.user)

    fields = """
        applicationSections {
            reservationUnitOptions {
                allocatedTimeSlots {
                    dayOfTheWeek
                    beginTime
                    endTime
                }
            }
        }
    """

    query = applications_query(fields=fields)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1

    # No allocated time slots should be shown
    assert response.node(0) == {
        "applicationSections": [
            {
                "reservationUnitOptions": [
                    {
                        "allocatedTimeSlots": [],
                    },
                ],
            },
        ],
    }


def test_allocated_time_slot__query__perms__regular_user(graphql):
    AllocatedTimeSlotFactory.create()
    graphql.login_with_regular_user()

    response = graphql(allocations_query())

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 0
