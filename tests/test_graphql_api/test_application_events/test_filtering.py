import pytest

from applications.choices import ApplicantTypeChoice
from applications.models import ApplicationEvent, EventReservationUnit
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_events.helpers import events_query

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
