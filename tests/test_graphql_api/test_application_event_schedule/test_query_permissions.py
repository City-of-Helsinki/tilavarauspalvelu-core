import pytest

from tests.factories import ApplicationEventScheduleFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event_schedule.helpers import events_with_schedules_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


ALLOCATION_FIELDS = """
    applicationEventSchedules {
        pk
        declined
        allocatedDay
        allocatedBegin
        allocatedEnd
        allocatedReservationUnit {
            pk
            nameFi
        }
    }
"""


def test_staff_user_can_see_schedule_allocation_data(graphql):
    # given:
    # - There is an allocated application event schedule
    # - A staff user is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.STAFF)

    # when:
    # - User tries to access allocation data on application event schedules
    response = graphql(events_with_schedules_query(fields=ALLOCATION_FIELDS))

    # then:
    # - The data is returned in the response
    assert len(response.edges) == 1
    assert response.node(0) == {
        "applicationEventSchedules": [
            {
                "pk": schedule.pk,
                "declined": schedule.declined,
                "allocatedDay": schedule.allocated_day,
                "allocatedBegin": schedule.allocated_begin.isoformat(),
                "allocatedEnd": schedule.allocated_end.isoformat(),
                "allocatedReservationUnit": {
                    "pk": schedule.allocated_reservation_unit.pk,
                    "nameFi": schedule.allocated_reservation_unit.name,
                },
            }
        ],
    }


@pytest.mark.parametrize(
    "field",
    [
        "declined",
        "allocatedDay",
        "allocatedBegin",
        "allocatedEnd",
        "allocatedReservationUnit { pk }",
    ],
)
def test_application_owner_cannot_see_schedule_allocation_data(graphql, field):
    # given:
    # - There is an allocated application event schedule
    # - The owner of that application event schedule is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated()
    graphql.force_login(schedule.application_event.application.user)

    # when:
    # - User tries to access the given allocation data field
    fields = "applicationEventSchedules { %s }" % field
    response = graphql(events_with_schedules_query(fields=fields))

    # then:
    # - The response contains errors about permissions
    assert len(response.errors) == 1
    assert response.error_message(0) == "You do not have permission to access this field."


def test_regular_user_cannot_see_schedule_allocation_data(graphql):
    # given:
    # - There is an allocated application event schedule
    # - A regular user is using the system
    ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.REGULAR)

    # when:
    # - User tries to access allocation data on application event schedules
    response = graphql(events_with_schedules_query(fields=ALLOCATION_FIELDS))

    # then:
    # - The response is empty, since events are filtered to those the user has access to
    assert len(response.edges) == 0
