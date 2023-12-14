import datetime

import pytest
from django.utils.timezone import get_default_timezone

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice, WeekdayChoice
from tests.factories import ApplicationEventFactory, ApplicationEventScheduleFactory, ApplicationFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event_schedule.helpers import schedules_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


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
def test_application_event_schedule__order__by_ids(graphql, field, order):
    # given:
    # - There are three application event schedules
    schedules = {
        1: ApplicationEventScheduleFactory.create(),
        2: ApplicationEventScheduleFactory.create(),
        3: ApplicationEventScheduleFactory.create(),
    }
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=field)
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    ordering = iter(order)
    assert response.node(0) == {"pk": schedules[next(ordering)].pk}
    assert response.node(1) == {"pk": schedules[next(ordering)].pk}
    assert response.node(2) == {"pk": schedules[next(ordering)].pk}


def test_application_event_schedule__order__by_applicant__asc(graphql):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create(application_event__application__organisation__name="A")
    schedule_2 = ApplicationEventScheduleFactory.create(application_event__application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="applicant")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


def test_application_event_schedule__order__by_applicant__desc(graphql):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create(application_event__application__organisation__name="A")
    schedule_2 = ApplicationEventScheduleFactory.create(application_event__application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="-applicant")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_2.pk}
    assert response.node(1) == {"pk": schedule_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_application_event_name__asc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(**{f"application_event__name_{lang}": "A"})
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(**{f"application_event__name_{lang}": "B"})
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"application_event_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_application_event_name__desc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(**{f"application_event__name_{lang}": "A"})
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(**{f"application_event__name_{lang}": "B"})
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"-application_event_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_2.pk}
    assert response.node(1) == {"pk": schedule_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_allocated_unit_name__asc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__unit__name_{lang}": "A"},
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__unit__name_{lang}": "B"},
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"allocated_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_allocated_unit_name__desc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__unit__name_{lang}": "A"},
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__unit__name_{lang}": "B"},
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"-allocated_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_2.pk}
    assert response.node(1) == {"pk": schedule_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_allocated_reservation_unit_name__asc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__name_{lang}": "A"},
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__name_{lang}": "B"},
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"allocated_reservation_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event_schedule__order__by_allocated_reservation_unit_name__desc(graphql, lang):
    # given:
    # - There are two application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__name_{lang}": "A"},
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        **{f"allocated_reservation_unit__name_{lang}": "B"},
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by=f"-allocated_reservation_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": schedule_2.pk}
    assert response.node(1) == {"pk": schedule_1.pk}


def test_application_event_schedule__order__by_allocated_time_of_week__asc(graphql):
    # given:
    # - There are four application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.MONDAY,
        allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_3 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(13, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_4 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(13, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(15, 0, tzinfo=get_default_timezone()),
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="allocated_time_of_week")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 4, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_2.pk}
    assert response.node(2) == {"pk": schedule_3.pk}
    assert response.node(3) == {"pk": schedule_4.pk}


def test_application_event_schedule__order__by_allocated_time_of_week__desc(graphql):
    # given:
    # - There are four application event schedules
    schedule_1 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.MONDAY,
        allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_2 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(12, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_3 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(13, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(14, 0, tzinfo=get_default_timezone()),
    )
    schedule_4 = ApplicationEventScheduleFactory.create_allocated(
        allocated_day=WeekdayChoice.TUESDAY,
        allocated_begin=datetime.time(13, 0, tzinfo=get_default_timezone()),
        allocated_end=datetime.time(15, 0, tzinfo=get_default_timezone()),
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="-allocated_time_of_week")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 4, response
    assert response.node(0) == {"pk": schedule_4.pk}
    assert response.node(1) == {"pk": schedule_3.pk}
    assert response.node(2) == {"pk": schedule_2.pk}
    assert response.node(3) == {"pk": schedule_1.pk}


def test_application_event_schedule__order__by_application_status__asc(graphql):
    # given:
    # - There are application event schedules with different application statuses
    application_1 = ApplicationFactory.create_in_status_cancelled(
        application_events__application_event_schedules__declined=False,
    )
    schedule_1 = application_1.application_events.first().application_event_schedules.first()
    application_2 = ApplicationFactory.create_in_status_draft(
        application_events__application_event_schedules__declined=False,
    )
    schedule_2 = application_2.application_events.first().application_event_schedules.first()
    application_3 = ApplicationFactory.create_in_status_received(
        application_events__application_event_schedules__declined=False,
    )
    schedule_3 = application_3.application_events.first().application_event_schedules.first()
    application_4 = ApplicationFactory.create_in_status_result_sent(
        application_events__application_event_schedules__declined=False,
    )
    schedule_4 = application_4.application_events.first().application_event_schedules.first()
    application_5 = ApplicationFactory.create_in_status_expired(
        application_events__application_event_schedules__declined=False,
    )
    schedule_5 = application_5.application_events.first().application_event_schedules.first()
    application_6 = ApplicationFactory.create_in_status_handled(
        application_events__application_event_schedules__declined=False,
    )
    schedule_6 = application_6.application_events.first().application_event_schedules.first()
    application_7 = ApplicationFactory.create_in_status_in_allocation(
        application_events__application_event_schedules__declined=False,
    )
    schedule_7 = application_7.application_events.first().application_event_schedules.first()

    # Double check that values are correct
    assert application_1.status == ApplicationStatusChoice.CANCELLED
    assert application_2.status == ApplicationStatusChoice.DRAFT
    assert application_3.status == ApplicationStatusChoice.RECEIVED
    assert application_4.status == ApplicationStatusChoice.RESULTS_SENT
    assert application_5.status == ApplicationStatusChoice.EXPIRED
    assert application_6.status == ApplicationStatusChoice.HANDLED
    assert application_7.status == ApplicationStatusChoice.IN_ALLOCATION

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="application_status")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 7, response
    assert response.node(0) == {"pk": schedule_2.pk}
    assert response.node(1) == {"pk": schedule_1.pk}
    assert response.node(2) == {"pk": schedule_5.pk}
    assert response.node(3) == {"pk": schedule_3.pk}
    assert response.node(4) == {"pk": schedule_7.pk}
    assert response.node(5) == {"pk": schedule_6.pk}
    assert response.node(6) == {"pk": schedule_4.pk}


def test_application_event_schedule__order__by_application_status__desc(graphql):
    # given:
    # - There are application event schedules with different application statuses
    application_1 = ApplicationFactory.create_in_status_cancelled(
        application_events__application_event_schedules__declined=False,
    )
    schedule_1 = application_1.application_events.first().application_event_schedules.first()
    application_2 = ApplicationFactory.create_in_status_draft(
        application_events__application_event_schedules__declined=False,
    )
    schedule_2 = application_2.application_events.first().application_event_schedules.first()
    application_3 = ApplicationFactory.create_in_status_received(
        application_events__application_event_schedules__declined=False,
    )
    schedule_3 = application_3.application_events.first().application_event_schedules.first()
    application_4 = ApplicationFactory.create_in_status_result_sent(
        application_events__application_event_schedules__declined=False,
    )
    schedule_4 = application_4.application_events.first().application_event_schedules.first()
    application_5 = ApplicationFactory.create_in_status_expired(
        application_events__application_event_schedules__declined=False,
    )
    schedule_5 = application_5.application_events.first().application_event_schedules.first()
    application_6 = ApplicationFactory.create_in_status_handled(
        application_events__application_event_schedules__declined=False,
    )
    schedule_6 = application_6.application_events.first().application_event_schedules.first()
    application_7 = ApplicationFactory.create_in_status_in_allocation(
        application_events__application_event_schedules__declined=False,
    )
    schedule_7 = application_7.application_events.first().application_event_schedules.first()

    # Double check that values are correct
    assert application_1.status == ApplicationStatusChoice.CANCELLED
    assert application_2.status == ApplicationStatusChoice.DRAFT
    assert application_3.status == ApplicationStatusChoice.RECEIVED
    assert application_4.status == ApplicationStatusChoice.RESULTS_SENT
    assert application_5.status == ApplicationStatusChoice.EXPIRED
    assert application_6.status == ApplicationStatusChoice.HANDLED
    assert application_7.status == ApplicationStatusChoice.IN_ALLOCATION

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="-application_status")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 7, response
    assert response.node(0) == {"pk": schedule_4.pk}
    assert response.node(1) == {"pk": schedule_6.pk}
    assert response.node(2) == {"pk": schedule_7.pk}
    assert response.node(3) == {"pk": schedule_3.pk}
    assert response.node(4) == {"pk": schedule_5.pk}
    assert response.node(5) == {"pk": schedule_1.pk}
    assert response.node(6) == {"pk": schedule_2.pk}


def test_application_event_schedule__order__by_application_event_status__asc(graphql):
    # given:
    # - There are application event schedules with different application event statuses
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application_event_schedules__declined=False)
    schedule_1 = event_1.application_event_schedules.first()
    event_2 = ApplicationEventFactory.create_in_status_approved(application_event_schedules__declined=False)
    schedule_2 = event_2.application_event_schedules.first()
    event_3 = ApplicationEventFactory.create_in_status_reserved(application_event_schedules__declined=False)
    schedule_3 = event_3.application_event_schedules.first()
    event_4 = ApplicationEventFactory.create_in_status_failed(application_event_schedules__declined=False)
    schedule_4 = event_4.application_event_schedules.first()
    event_5 = ApplicationEventFactory.create_in_status_declined(application_event_schedules__declined=True)
    schedule_5 = event_5.application_event_schedules.first()

    # Double check that values are correct
    assert event_1.status == ApplicationEventStatusChoice.UNALLOCATED
    assert event_2.status == ApplicationEventStatusChoice.APPROVED
    assert event_3.status == ApplicationEventStatusChoice.RESERVED
    assert event_4.status == ApplicationEventStatusChoice.FAILED
    assert event_5.status == ApplicationEventStatusChoice.DECLINED

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="application_event_status")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 5, response
    assert response.node(0) == {"pk": schedule_1.pk}
    assert response.node(1) == {"pk": schedule_5.pk}
    assert response.node(2) == {"pk": schedule_2.pk}
    assert response.node(3) == {"pk": schedule_4.pk}
    assert response.node(4) == {"pk": schedule_3.pk}


def test_application_event_schedule__order__by_application_event_status__desc(graphql):
    # given:
    # - There are application event schedules with different application event statuses
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application_event_schedules__declined=False)
    schedule_1 = event_1.application_event_schedules.first()
    event_2 = ApplicationEventFactory.create_in_status_approved(application_event_schedules__declined=False)
    schedule_2 = event_2.application_event_schedules.first()
    event_3 = ApplicationEventFactory.create_in_status_reserved(application_event_schedules__declined=False)
    schedule_3 = event_3.application_event_schedules.first()
    event_4 = ApplicationEventFactory.create_in_status_failed(application_event_schedules__declined=False)
    schedule_4 = event_4.application_event_schedules.first()
    event_5 = ApplicationEventFactory.create_in_status_declined(application_event_schedules__declined=True)
    schedule_5 = event_5.application_event_schedules.first()

    # Double check that values are correct
    assert event_1.status == ApplicationEventStatusChoice.UNALLOCATED
    assert event_2.status == ApplicationEventStatusChoice.APPROVED
    assert event_3.status == ApplicationEventStatusChoice.RESERVED
    assert event_4.status == ApplicationEventStatusChoice.FAILED
    assert event_5.status == ApplicationEventStatusChoice.DECLINED

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - Use tries to fetch the application event schedules in the given order
    query = schedules_query(order_by="-application_event_status")
    response = graphql(query)

    # then:
    # - The response contains only the recurring reservation in the given order
    assert response.has_errors is False, response
    assert len(response.edges) == 5, response
    assert response.node(0) == {"pk": schedule_3.pk}
    assert response.node(1) == {"pk": schedule_4.pk}
    assert response.node(2) == {"pk": schedule_2.pk}
    assert response.node(3) == {"pk": schedule_5.pk}
    assert response.node(4) == {"pk": schedule_1.pk}
