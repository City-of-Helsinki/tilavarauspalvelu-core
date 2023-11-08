from datetime import date

import pytest

from applications.choices import ApplicationEventStatusChoice
from applications.models import ApplicationEvent
from common.utils import timedelta_from_json
from tests.factories import ApplicationEventFactory, EventReservationUnitFactory
from tests.test_graphql_api.test_application_event.helpers import UPDATE_MUTATION, get_application_event_update_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_update_application_event(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to update the application event
    data = get_application_event_update_data(application_event=application_event)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application event
    # - The fields on the application event correspond to the creation request
    # - The application event is in status UNALLOCATED
    assert response.has_errors is False, response

    application_events: list[ApplicationEvent] = list(ApplicationEvent.objects.all())
    assert len(application_events) == 1

    event = application_events[0]

    assert event.name == data["name"]
    assert event.num_persons == data["numPersons"]
    assert event.application == application_event.application
    assert event.age_group_id == data["ageGroup"]
    assert event.ability_group_id == data["abilityGroup"]
    assert event.purpose_id == data["purpose"]
    assert event.min_duration == timedelta_from_json(data["minDuration"])
    assert event.max_duration == timedelta_from_json(data["maxDuration"])
    assert event.begin == date.fromisoformat(data["begin"])
    assert event.end == date.fromisoformat(data["end"])
    assert event.events_per_week == data["eventsPerWeek"]
    assert event.biweekly == data["biweekly"]
    assert event.flagged is False

    assert event.application_event_schedules.count() == 1
    assert event.event_reservation_units.count() == 1

    assert event.status == ApplicationEventStatusChoice.UNALLOCATED


def test_cannot_update_application_event_with_smaller_max_duration_than_min_duration(graphql):
    # given:
    # - There is an unallocated application event in a draft application in an open application round
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to update the application event with a smaller max duration than min duration
    data = get_application_event_update_data(application_event=application_event)
    data["minDuration"] = "01:00:00"
    data["maxDuration"] = "00:45:00"
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the max duration
    assert response.field_error_messages("maxDuration") == ["Maximum duration should be larger than minimum duration"]


def test_update_application_event__switch_event_reservation_unit_preferred_order(graphql):
    # given:
    # - There is an application event with two event reservation units
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    event_unit_1 = EventReservationUnitFactory.create(application_event=application_event, preferred_order=1)
    event_unit_2 = EventReservationUnitFactory.create(application_event=application_event, preferred_order=2)
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to update the application event, switching the preferred order of the event reservation units
    data = {
        "pk": application_event.pk,
        "eventReservationUnits": [
            {
                "pk": event_unit_1.pk,
                "preferredOrder": event_unit_2.preferred_order,
            },
            {
                "pk": event_unit_2.pk,
                "preferredOrder": event_unit_1.preferred_order,
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The preferred order between the two event reservation units has been switched
    assert response.has_errors is False, response
    event_unit_1.refresh_from_db()
    event_unit_2.refresh_from_db()
    assert event_unit_1.preferred_order == 2
    assert event_unit_2.preferred_order == 1


@pytest.mark.django_db(transaction=True)
def test_update_application_event__cannot_have_two_event_reservation_units_with_same_preferred_order(graphql):
    # given:
    # - There is an application event with two event reservation units
    # - The owner of the application is using the system
    application_event = ApplicationEventFactory.create_in_status_unallocated()
    event_unit_1 = EventReservationUnitFactory.create(application_event=application_event, preferred_order=1)
    event_unit_2 = EventReservationUnitFactory.create(application_event=application_event, preferred_order=2)
    graphql.force_login(application_event.application.user)

    # when:
    # - User tries to update the application event, switching the preferred order of the event reservation units
    data = {
        "pk": application_event.pk,
        "eventReservationUnits": [
            {
                "pk": event_unit_1.pk,
                "preferredOrder": event_unit_1.preferred_order,
            },
            {
                "pk": event_unit_2.pk,
                "preferredOrder": event_unit_1.preferred_order,
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about violating unique constraint
    assert response.has_errors is True, response
    msg = 'duplicate key value violates unique constraint "unique_application_event_preferred_order"'
    assert msg in response.field_error_messages()[0]
