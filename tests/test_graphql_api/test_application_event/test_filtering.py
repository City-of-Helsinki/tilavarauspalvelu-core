import pytest

from applications.choices import ApplicantTypeChoice, PriorityChoice
from applications.models import ApplicationEvent, EventReservationUnit
from tests.factories import (
    AgeGroupFactory,
    ApplicationEventFactory,
    ApplicationFactory,
    CityFactory,
    ReservationPurposeFactory,
)
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import events_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_can_filter_application_event__by_pk(graphql):
    # given:
    # - There is draft application in an open application round with two application events
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    ApplicationEventFactory.create_in_status_unallocated(application=application)
    graphql.force_login(application.user)

    # when:
    # - User tries to filter application events with a primary key
    query = events_query(pk=event_1.pk)
    response = graphql(query)

    # then:
    # - The response contains only the event with the given primary key
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_pk__multiple(graphql):
    # given:
    # - There is draft application in an open application round with two application events
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    graphql.force_login(application.user)

    # when:
    # - User tries to filter application events with a primary key
    query = events_query(pk=[event_1.pk, event_2.pk])
    response = graphql(query)

    # then:
    # - The response contains only the event with the given primary key
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_name(graphql):
    # given:
    # - There is a draft application in an application round with three application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(name="foo", application=application)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(name="foobar", application=application)
    ApplicationEventFactory.create_in_status_unallocated(name="bar", application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events whose name starts with "foo"
    query = events_query(name__istartswith="foo")
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_application(graphql):
    # given:
    # - There are two draft application in the same application round with one application event each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_draft(application_round=application_1.application_round)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with an application primary key
    query = events_query(application=application_1.pk)
    response = graphql(query)

    # then:
    # - The response contains only the event from the given application
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_application_round(graphql):
    # given:
    # - There are two draft application in different application rounds with one application event each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with an application round primary key
    query = events_query(application_round=application_1.application_round.pk)
    response = graphql(query)

    # then:
    # - The response contains only the event from the given application round
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_unit(graphql):
    # given:
    # - There is a draft application in an application round with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="foo",
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    event_reservation_unit: EventReservationUnit = event_1.event_reservation_units.first()

    # when:
    # - User tries to filter application events with a specific unit
    query = events_query(unit=event_reservation_unit.reservation_unit.unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_unit__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="foo",
    )
    event_2 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    event_reservation_unit_1: EventReservationUnit = event_1.event_reservation_units.first()
    event_reservation_unit_2: EventReservationUnit = event_2.event_reservation_units.first()

    # when:
    # - User tries to filter application events with any of the given units
    query = events_query(
        unit=[
            event_reservation_unit_1.reservation_unit.unit.pk,
            event_reservation_unit_2.reservation_unit.unit.pk,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_reservation_unit(graphql):
    # given:
    # - There is a draft application in an application round with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="foo",
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    event_reservation_unit: EventReservationUnit = event_1.event_reservation_units.first()

    # when:
    # - User tries to filter application events with a specific reservation unit
    query = events_query(reservation_unit=event_reservation_unit.reservation_unit.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_reservation_unit__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="foo",
    )
    event_2 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__reservation_unit__name="bar",
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    event_reservation_unit_1: EventReservationUnit = event_1.event_reservation_units.first()
    event_reservation_unit_2: EventReservationUnit = event_2.event_reservation_units.first()

    # when:
    # - User tries to filter application events with any of the given reservation units
    query = events_query(
        reservation_unit=[
            event_reservation_unit_1.reservation_unit.pk,
            event_reservation_unit_2.reservation_unit.pk,
        ]
    )
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_user(graphql):
    # given:
    # - There is a draft application in an application round with three application events
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific application owner
    query = events_query(user=application_1.user.pk)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_applicant_type(graphql):
    # given:
    # - There is a draft application in an application round with three application events
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMPANY)
    application_2 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events of a specific applicant type
    query = events_query(applicant_type=ApplicantTypeChoice.COMPANY)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_applicant_type__multiple(graphql):
    # given:
    # - There is a draft application in an application round with three application events
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.COMPANY)
    application_2 = ApplicationFactory.create_in_status_draft(applicant_type=ApplicantTypeChoice.INDIVIDUAL)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with any of the given applicant types
    query = events_query(applicant_type=[ApplicantTypeChoice.COMPANY, ApplicantTypeChoice.INDIVIDUAL])
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_status(graphql):
    # given:
    # - There is a draft application in an application round with two application events with different statuses
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    event_2 = ApplicationEventFactory.create_in_status_declined(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    application_events = list(ApplicationEvent.objects.all().order_by("pk").with_event_status())
    assert len(application_events) == 2
    assert application_events[0].pk == event_1.pk
    assert application_events[0].event_status == event_1.status.value
    assert application_events[1].pk == event_2.pk
    assert application_events[1].event_status == event_2.status.value

    # when:
    # - User tries to filter application events with a specific status
    query = events_query(status=event_1.status)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_status__multiple(graphql):
    # given:
    # - There is a draft application in an application round with two application events with different statuses
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    event_2 = ApplicationEventFactory.create_in_status_declined(application=application)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    application_events = list(ApplicationEvent.objects.all().order_by("pk").with_event_status())
    assert len(application_events) == 2
    assert application_events[0].pk == event_1.pk
    assert application_events[0].event_status == event_1.status.value
    assert application_events[1].pk == event_2.pk
    assert application_events[1].event_status == event_2.status.value

    # when:
    # - User tries to filter application events with a specific statuses
    query = events_query(status=[event_1.status, event_2.status])
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_application_status(graphql):
    # given:
    # - There are two applications in different statuses in the same application round with one application event each
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_draft()
    application_2 = ApplicationFactory.create_in_status_in_allocation(application_events=[])
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    application_events = list(ApplicationEvent.objects.all().order_by("pk").with_application_status())
    assert len(application_events) == 2
    assert application_events[0].pk == event_1.pk
    assert application_events[0].application_status == application_1.status.value
    assert application_events[1].pk == event_2.pk
    assert application_events[1].application_status == application_2.status.value

    # when:
    # - User tries to filter application events with a specific status
    query = events_query(application_status=application_1.status)
    response = graphql(query)

    # then:
    # - The response contains the right application events
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_priority(graphql):
    # given:
    # - There is a draft application with application events with different priorities
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.HIGH,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.MEDIUM,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.LOW,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific priority
    query = events_query(priority=PriorityChoice.HIGH)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application event
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_priority__multiple(graphql):
    # given:
    # - There is a draft application with application events with different priorities
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.HIGH,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.MEDIUM,
    )
    event_2 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        application_event_schedules__priority=PriorityChoice.LOW,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific priorities
    query = events_query(priority=[PriorityChoice.HIGH, PriorityChoice.LOW])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_preferred_order(graphql):
    # given:
    # - There is a draft application with application events with different preferred orders
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=1,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=2,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=3,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific preferred order
    query = events_query(preferred_order=1)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application event
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_preferred_order__multiple(graphql):
    # given:
    # - There is a draft application with application events with different preferred orders
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=1,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=2,
    )
    event_2 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=3,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific preferred orders
    query = events_query(preferred_order=[1, 3])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_include_preferred_order_10_or_higher(graphql):
    # given:
    # - There is a draft application with application events with different preferred orders (some of which are 10+)
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=1,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=2,
    )
    event_3 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=10,
    )
    event_4 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=11,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a preferred order 10 or higher
    query = events_query(include_preferred_order_10_or_higher=True)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_3.pk}
    assert response.node(1) == {"pk": event_4.pk}


def test_can_filter_application_event__by_include_preferred_order_10_or_higher__with_higher(graphql):
    # given:
    # - There is a draft application with application events with different preferred orders (some of which are 10+)
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=1,
    )
    ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=2,
    )
    event_3 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=10,
    )
    event_4 = ApplicationEventFactory.create_in_status_unallocated(
        application=application,
        event_reservation_units__priority=11,
    )
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a preferred order 10 or higher, and a specific preferred order
    query = events_query(preferred_order=1, include_preferred_order_10_or_higher=True)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application event
    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_3.pk}
    assert response.node(2) == {"pk": event_4.pk}


def test_can_filter_application_event__by_home_city(graphql):
    # given:
    # - There are two application with different home cities, each with one application event
    # - A superuser is using the system
    city_1 = CityFactory.create(name="Helsinki")
    city_2 = CityFactory.create(name="Other")
    application_1 = ApplicationFactory.create_in_status_draft(home_city=city_1)
    application_2 = ApplicationFactory.create_in_status_draft(home_city=city_2)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific preferred order
    query = events_query(home_city=city_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application event
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_home_city__multiple(graphql):
    # given:
    # - There are two application with different home cities, each with one application event
    # - A superuser is using the system
    city_1 = CityFactory.create(name="Helsinki")
    city_2 = CityFactory.create(name="Other")
    application_1 = ApplicationFactory.create_in_status_draft(home_city=city_1)
    application_2 = ApplicationFactory.create_in_status_draft(home_city=city_2)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application_1)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a specific preferred order
    query = events_query(home_city=[city_1.pk, city_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application event
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_age_group(graphql):
    # given:
    # - There is an application with two application events with different age groups
    # - A superuser is using the system
    age_group_1 = AgeGroupFactory.create()
    age_group_2 = AgeGroupFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application, age_group=age_group_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application, age_group=age_group_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a given age group
    query = events_query(age_group=age_group_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_age_group__multiple(graphql):
    # given:
    # - There is an application with two application events with different age groups
    # - A superuser is using the system
    age_group_1 = AgeGroupFactory.create()
    age_group_2 = AgeGroupFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application, age_group=age_group_1)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application, age_group=age_group_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a given age groups
    query = events_query(age_group=[age_group_1.pk, age_group_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_purpose(graphql):
    # given:
    # - There is an application with two application events with different reservation purposes
    # - A superuser is using the system
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application, purpose=purpose_1)
    ApplicationEventFactory.create_in_status_unallocated(application=application, purpose=purpose_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a given reservation purpose
    query = events_query(purpose=purpose_1.pk)
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_purpose__multiple(graphql):
    # given:
    # - There is an application with two application events with different reservation purposes
    # - A superuser is using the system
    purpose_1 = ReservationPurposeFactory.create()
    purpose_2 = ReservationPurposeFactory.create()
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application, purpose=purpose_1)
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application, purpose=purpose_2)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a given reservation purpose
    query = events_query(purpose=[purpose_1.pk, purpose_2.pk])
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_can_filter_application_event__by_text_search__event_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(organisation=None, contact_person=None, user=None)
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    ApplicationEventFactory.create_in_status_unallocated(application=application, name="bar")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="foo")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event_1.pk}


def test_can_filter_application_event__by_text_search__applicant__organisation_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation__name="fizz",
        contact_person=None,
        user=None,
    )
    event = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event.pk}


def test_can_filter_application_event__by_text_search__applicant__contact_person_first_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="fizz",
        contact_person__last_name="none",
        user=None,
    )
    event = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event.pk}


def test_can_filter_application_event__by_text_search__applicant__contact_person_last_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person__first_name="none",
        contact_person__last_name="fizz",
        user=None,
    )
    event = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event.pk}


def test_can_filter_application_event__by_text_search__applicant__user_first_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="fizz",
        user__last_name="none",
    )
    event = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event.pk}


def test_can_filter_application_event__by_text_search__applicant__user_last_name(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation=None,
        contact_person=None,
        user__first_name="none",
        user__last_name="fizz",
    )
    event = ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="fizz")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains the right application events
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": event.pk}


def test_can_filter_application_event__by_text_search__not_found(graphql):
    # given:
    # - There is an application with two application events
    # - A superuser is using the system
    application = ApplicationFactory.create_in_status_draft(
        organisation__name="org",
        contact_person__first_name="fizz",
        contact_person__last_name="buzz",
        user__first_name="person",
        user__last_name="one",
    )
    ApplicationEventFactory.create_in_status_unallocated(application=application, name="foo")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to filter application events with a text search
    query = events_query(text_search="not found")
    response = graphql(query)

    # then:
    # - The response contains no errors
    # - The response contains no application events
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response
