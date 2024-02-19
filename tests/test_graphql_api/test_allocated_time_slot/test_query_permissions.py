import pytest

from tests.factories import AllocatedTimeSlotFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application.helpers import applications_query

from .helpers import allocations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__query__perms__staff_user(graphql):
    # given:
    # - There is an allocated time slot
    # - A staff user is using the system
    allocation = AllocatedTimeSlotFactory.create()
    graphql.login_user_based_on_type(UserType.STAFF)

    # when:
    # - User tries to access allocated time slots
    response = graphql(allocations_query())

    # then:
    # - The data is returned in the response
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": allocation.pk}


def test_allocated_time_slot__query__perms__application_owner(graphql):
    # given:
    # - There is an allocated time slot
    # - The owner of that application is using the system
    allocation = AllocatedTimeSlotFactory.create()
    graphql.force_login(allocation.reservation_unit_option.application_section.application.user)

    # when:
    # - User tries to access allocated time slots
    response = graphql(allocations_query())

    # then:
    # - The response contains errors about permissions
    assert response.error_message() == "No permission to access node."


def test_allocated_time_slot__query__perms__application_owner__through_application(graphql):
    # given:
    # - There is an allocated time slot
    # - The owner of that application is using the system
    allocation = AllocatedTimeSlotFactory.create()
    graphql.force_login(allocation.reservation_unit_option.application_section.application.user)

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

    # when:
    # - User tries to access allocated time slots through their application,
    #   since they are too curious about what slot they will be given
    query = applications_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains errors about permissions, since the user shouldn't
    #   have access to the allocated time slots before the allocation period is finished.
    assert response.error_message("allocatedTimeSlots") == "No permission to access node."


def test_allocated_time_slot__query__perms__regular_user(graphql):
    # given:
    # - There is an allocated time slot
    # - A regular user is using the system
    AllocatedTimeSlotFactory.create()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to access allocated time slots
    response = graphql(allocations_query())

    # then:
    # - The response contains errors about permissions
    assert response.error_message() == "No permission to access node."
