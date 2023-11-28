import pytest

from tests.factories import ApplicationEventFactory, ApplicationEventScheduleFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event_schedule.helpers import events_with_schedules_query, schedules_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_events__query__with_schedules__all_fields(graphql):
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
    response = graphql(events_with_schedules_query(fields=fields))

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


def test_application_event_schedules__query__all_fields(graphql):
    # given:
    # - There is an allocated application event schedule
    schedule = ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    fields = """
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
    """

    # when:
    # - User tries to search all fields for application schedules
    response = graphql(schedules_query(fields=fields))

    # then:
    # - The response contains the selected fields
    assert len(response.edges) == 1
    assert response.node(0) == {
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


def test_application_event_schedules__filter__by_pk(graphql):
    # given:
    # - There are two allocated application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated()
    ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given pk
    response = graphql(schedules_query(pk=schedule.pk))

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_pk__multiple(graphql):
    # given:
    # - There are two allocated application event schedules
    # - A superuser is using the system
    schedule_1 = ApplicationEventScheduleFactory.create_allocated()
    schedule_2 = ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given pk
    response = graphql(schedules_query(pk=[schedule_1.pk, schedule_2.pk]))

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application_event_schedules__filter__by_application_round(graphql):
    # given:
    # - There are two allocated application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated()
    ApplicationEventScheduleFactory.create_allocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given application round pk
    response = graphql(schedules_query(application_round=schedule.application_event.application.application_round.pk))

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_application_event_status(graphql):
    # given:
    # - There are two allocated application event schedules in two application events with different states
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_declined()
    ApplicationEventFactory.create_in_status_approved()
    schedule = event_1.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given application event status
    response = graphql(schedules_query(application_event_status=event_1.status))

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_application_event_status__multiple(graphql):
    # given:
    # - There are two allocated application event schedules in two application events with different states
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_declined()
    event_2 = ApplicationEventFactory.create_in_status_approved()
    ApplicationEventFactory.create_in_status_unallocated()
    schedule_1 = event_1.application_event_schedules.first()
    schedule_2 = event_2.application_event_schedules.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given application event statuses
    response = graphql(schedules_query(application_event_status=[event_1.status, event_2.status]))

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


@pytest.mark.parametrize(
    ("field", "order"),
    [
        ("pk", [1, 2, 3]),
        ("-pk", [3, 2, 1]),
        ("application_event_id", [1, 2, 3]),
        ("-application_event_id", [3, 2, 1]),
        ("application_id", [1, 2, 3]),
        ("-application_id", [3, 2, 1]),
    ],
)
def test_application_event_schedule__order(graphql, field, order):
    schedules = {
        1: ApplicationEventScheduleFactory.create(),
        2: ApplicationEventScheduleFactory.create(),
        3: ApplicationEventScheduleFactory.create(),
    }
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    response = graphql(schedules_query(order_by=field))

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    ordering = iter(order)
    assert response.node(0) == {"pk": schedules[next(ordering)].pk}
    assert response.node(1) == {"pk": schedules[next(ordering)].pk}
    assert response.node(2) == {"pk": schedules[next(ordering)].pk}
