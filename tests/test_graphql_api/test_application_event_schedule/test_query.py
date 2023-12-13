import pytest

from applications.choices import ApplicantTypeChoice, WeekdayChoice
from tests.factories import ApplicationEventFactory, ApplicationEventScheduleFactory, ReservationUnitFactory
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


def test_application_event_schedules__filter__by_applicant_type(graphql):
    # given:
    # - There are two allocated application event schedules with different applicant types
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__applicant_type=ApplicantTypeChoice.INDIVIDUAL,
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__applicant_type=ApplicantTypeChoice.COMPANY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given applicant type
    query = schedules_query(applicant_type=schedule.application_event.application.applicant_type)
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_applicant_type__multiple(graphql):
    # given:
    # - There are two allocated application event schedules with different applicant types
    # - A superuser is using the system
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__applicant_type=ApplicantTypeChoice.INDIVIDUAL,
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__applicant_type=ApplicantTypeChoice.COMPANY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given applicant types
    query = schedules_query(
        applicant_type=[
            schedule_1.application_event.application.applicant_type,
            schedule_2.application_event.application.applicant_type,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application_event_schedules__filter__by_allocated_unit(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    schedule = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_1,
    )
    ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_2,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated unit
    query = schedules_query(allocated_unit=reservation_unit_1.unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_allocated_unit__multiple(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_1,
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_2,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated units
    query = schedules_query(allocated_unit=[reservation_unit_1.unit.pk, reservation_unit_2.unit.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application_event_schedules__filter__by_allocated_reservation_unit(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated reservation units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    schedule = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_1,
    )
    ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_2,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated reservation unit
    query = schedules_query(allocated_reservation_unit=reservation_unit_1.pk)
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_allocated_reservation_unit__multiple(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated reservation units
    # - A superuser is using the system
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_1,
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        allocated_reservation_unit=reservation_unit_2,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated reservation unit
    query = schedules_query(allocated_reservation_unit=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application_event_schedules__filter__by_allocated_day(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated day
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.MONDAY,
    )
    ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated day
    query = schedules_query(allocated_day=schedule.allocated_day)
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": schedule.pk}


def test_application_event_schedules__filter__by_allocated_day__multiple(graphql):
    # given:
    # - There are two allocated application event schedules with different allocated day
    # - A superuser is using the system
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.MONDAY,
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search application schedules with the given allocated days
    query = schedules_query(allocated_day=[schedule_1.allocated_day, schedule_2.allocated_day])
    response = graphql(query)

    # then:
    # - The response contains the selected schedules
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application__filter__by_text_search__event_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="foo",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__event_name__prefix(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="foo",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search, which is only a prefix match
    query = schedules_query(text_search="fo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__event_name__has_quotes(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="Moe's Bar",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="Bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search, which is only a partial match
    query = schedules_query(text_search="Moe's")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__organisation_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation__name="foo",
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name=".",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation__name="bar",
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name=".",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__contact_person_first_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person__first_name="foo",
        application_event__application__contact_person__last_name="none",
        application_event__application__user=None,
        application_event__name=".",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person__first_name="bar",
        application_event__application__contact_person__last_name="none",
        application_event__application__user=None,
        application_event__name=".",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__contact_person_last_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person__first_name="none",
        application_event__application__contact_person__last_name="foo",
        application_event__application__user=None,
        application_event__name=".",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person__first_name="none",
        application_event__application__contact_person__last_name="bar",
        application_event__application__user=None,
        application_event__name=".",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__user_first_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user__first_name="foo",
        application_event__application__user__last_name="none",
        application_event__name=".",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user__first_name="bar",
        application_event__application__user__last_name="none",
        application_event__name=".",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__applicant__user_last_name(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user__first_name="none",
        application_event__application__user__last_name="foo",
        application_event__name=".",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user__first_name="none",
        application_event__application__user__last_name="bar",
        application_event__name=".",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__event_id(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="foo",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search=f"{schedule.application_event.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__application_id(graphql):
    # given:
    # - There are two application event schedules
    # - A superuser is using the system
    schedule = ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="foo",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter applications event schedules with a text search
    query = schedules_query(text_search=f"{schedule.application_event.application.pk}")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application schedule
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": schedule.pk}


def test_application__filter__by_text_search__not_found(graphql):
    # given:
    # - There is an application with an application event
    # - A superuser is using the system
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="foo",
    )
    ApplicationEventScheduleFactory.create_allocated(
        application_event__application__organisation=None,
        application_event__application__contact_person=None,
        application_event__application__user=None,
        application_event__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = schedules_query(text_search="not found")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains no application events
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response


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
