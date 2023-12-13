import pytest

from tests.factories import ApplicationEventFactory, ApplicationFactory, EventReservationUnitFactory
from tests.helpers import UserType
from tests.test_graphql_api.test_application_event.helpers import events_query_no_ordering

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_application_event__order__by_pk__asc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by the primary key ascending
    query = events_query_no_ordering(order_by="pk")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_application_event__order__by_pk__desc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by the primary key descending
    query = events_query_no_ordering(order_by="-pk")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_2.pk}
    assert response.node(1) == {"pk": event_1.pk}


def test_application_event__order__by_application_id__asc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by application id ascending
    query = events_query_no_ordering(order_by="application_id")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_application_event__order__by_application_id__desc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by application id descending
    query = events_query_no_ordering(order_by="-application_id")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_2.pk}
    assert response.node(1) == {"pk": event_1.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event__order__by_name__asc(graphql, lang):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated(**{f"name_{lang}": "A"})
    event_2 = ApplicationEventFactory.create_in_status_unallocated(**{f"name_{lang}": "B"})
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by name in the given language ascending
    query = events_query_no_ordering(order_by=f"name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event__order__by_name__desc(graphql, lang):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated(**{f"name_{lang}": "A"})
    event_2 = ApplicationEventFactory.create_in_status_unallocated(**{f"name_{lang}": "B"})
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by name in the given language descending
    query = events_query_no_ordering(order_by=f"-name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_2.pk}
    assert response.node(1) == {"pk": event_1.pk}


def test_application_event__order__by_applicant__asc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application__organisation__name="A")
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by applicant ascending
    query = events_query_no_ordering(order_by="applicant")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_1.pk}
    assert response.node(1) == {"pk": event_2.pk}


def test_application_event__order__by_applicant__desc(graphql):
    # given:
    # - There are two application events
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application__organisation__name="A")
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application__organisation__name="B")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to order application events by applicant descending
    query = events_query_no_ordering(order_by="-applicant")
    response = graphql(query)

    # then:
    # - The response contains the application event in the correct order
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": event_2.pk}
    assert response.node(1) == {"pk": event_1.pk}


def test_application_event__order__by_application_status__asc(graphql):
    # given:
    # - There are application events in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_cancelled(application_events__name="A")
    application_2 = ApplicationFactory.create_in_status_draft(application_events__name="A")
    application_3 = ApplicationFactory.create_in_status_received(application_events__name="A")
    application_4 = ApplicationFactory.create_in_status_result_sent(application_events__name="A")
    application_5 = ApplicationFactory.create_in_status_expired(application_events__name="A")
    application_6 = ApplicationFactory.create_in_status_handled(application_events__name="A")
    application_7 = ApplicationFactory.create_in_status_in_allocation(application_events__name="A")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application events ordered by application statuses ascending
    query = events_query_no_ordering(order_by="application_status")
    response = graphql(query)

    # then:
    # - The response contains the application events in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": application_2.application_events.first().pk}
    assert response.node(1) == {"pk": application_1.application_events.first().pk}
    assert response.node(2) == {"pk": application_5.application_events.first().pk}
    assert response.node(3) == {"pk": application_3.application_events.first().pk}
    assert response.node(4) == {"pk": application_7.application_events.first().pk}
    assert response.node(5) == {"pk": application_6.application_events.first().pk}
    assert response.node(6) == {"pk": application_4.application_events.first().pk}


def test_application__order__by_application_status__desc(graphql):
    # given:
    # - There are application events in the system with different statuses
    # - A superuser is using the system
    application_1 = ApplicationFactory.create_in_status_cancelled(application_events__name="A")
    application_2 = ApplicationFactory.create_in_status_draft(application_events__name="A")
    application_3 = ApplicationFactory.create_in_status_received(application_events__name="A")
    application_4 = ApplicationFactory.create_in_status_result_sent(application_events__name="A")
    application_5 = ApplicationFactory.create_in_status_expired(application_events__name="A")
    application_6 = ApplicationFactory.create_in_status_handled(application_events__name="A")
    application_7 = ApplicationFactory.create_in_status_in_allocation(application_events__name="A")
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application events ordered by application statuses descending
    query = events_query_no_ordering(order_by="-application_status")
    response = graphql(query)

    # then:
    # - The response contains the application events in the wanted order
    assert len(response.edges) == 7
    assert response.node(0) == {"pk": application_4.application_events.first().pk}
    assert response.node(1) == {"pk": application_6.application_events.first().pk}
    assert response.node(2) == {"pk": application_7.application_events.first().pk}
    assert response.node(3) == {"pk": application_3.application_events.first().pk}
    assert response.node(4) == {"pk": application_5.application_events.first().pk}
    assert response.node(5) == {"pk": application_1.application_events.first().pk}
    assert response.node(6) == {"pk": application_2.application_events.first().pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application__order__by_preferred_unit_name__asc(graphql, lang):
    # given:
    # - There are two application events in the system
    # - The application events have a variety of event reservation units
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "C unit"},
    )

    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_2,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "B unit"},
    )
    # Not counted since not preferred order not 0
    EventReservationUnitFactory.create(
        application_event=event_2,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Event doesn't have event reservation units with preferred order 0 -> preferred_unit_name is None -> ordered last
    event_3 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_3,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Event doesn't have event reservation units at all -> preferred_unit_name is None -> ordered last
    event_4 = ApplicationEventFactory.create_in_status_unallocated()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application events ordered by preferred unit name in the given language ascending
    query = events_query_no_ordering(order_by=f"preferred_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": event_2.pk}
    assert response.node(1) == {"pk": event_1.pk}
    assert response.node(2) == {"pk": event_3.pk}
    assert response.node(3) == {"pk": event_4.pk}


@pytest.mark.parametrize("lang", ["fi", "en", "sv"])
def test_application_event__order__by_preferred_unit_name__desc(graphql, lang):
    # given:
    # - There are two application events in the system
    # - The application events have a variety of event reservation units
    # - A superuser is using the system
    event_1 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_1,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "C unit"},
    )

    event_2 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_2,
        preferred_order=0,
        **{f"reservation_unit__unit__name_{lang}": "B unit"},
    )
    # Not counted since not preferred order not 0
    EventReservationUnitFactory.create(
        application_event=event_2,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Event doesn't have event reservation units with preferred order 0 -> preferred_unit_name is None -> ordered first
    event_3 = ApplicationEventFactory.create_in_status_unallocated()
    EventReservationUnitFactory.create(
        application_event=event_3,
        preferred_order=1,
        **{f"reservation_unit__unit__name_{lang}": "A unit"},
    )

    # Event doesn't have event reservation units at all -> preferred_unit_name is None -> ordered first
    event_4 = ApplicationEventFactory.create_in_status_unallocated()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - User tries to search for application events ordered by preferred unit name in the given language descending
    query = events_query_no_ordering(order_by=f"-preferred_unit_name_{lang}")
    response = graphql(query)

    # then:
    # - The response contains the application in the wanted order
    assert len(response.edges) == 4
    assert response.node(0) == {"pk": event_3.pk}
    assert response.node(1) == {"pk": event_4.pk}
    assert response.node(2) == {"pk": event_1.pk}
    assert response.node(3) == {"pk": event_2.pk}
