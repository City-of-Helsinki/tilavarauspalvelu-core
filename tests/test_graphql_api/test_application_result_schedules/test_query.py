import pytest

from tests.factories import ApplicationEventScheduleFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_result_schedules.helpers import schedules_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_query_application_event_schedules__all_fields(graphql):
    # given:
    # - There is an allocated application event schedule
    schedule = ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
        applicationEventSchedules {
            pk
            day
            begin
            end
            allocatedDay
            allocatedBegin
            allocatedEnd
            declined
            priority
            allocatedReservationUnit {
                pk
                nameFi
            }
        }
    """

    # when:
    # - User tries to search all fields for application schedules in application events
    response = graphql(schedules_query(fields=fields))

    # then:
    # - The response contains the selected fields from the application event schedules
    assert len(response.edges) == 1
    assert response.node(0) == {
        "applicationEventSchedules": [
            {
                "pk": schedule.pk,
                "day": schedule.day,
                "begin": schedule.begin.isoformat(),
                "end": schedule.end.isoformat(),
                "allocatedDay": schedule.allocated_day,
                "allocatedBegin": schedule.allocated_begin.isoformat(),
                "allocatedEnd": schedule.allocated_end.isoformat(),
                "declined": schedule.declined,
                "priority": schedule.priority,
                "allocatedReservationUnit": {
                    "pk": schedule.allocated_reservation_unit.pk,
                    "nameFi": schedule.allocated_reservation_unit.name,
                },
            }
        ],
    }
