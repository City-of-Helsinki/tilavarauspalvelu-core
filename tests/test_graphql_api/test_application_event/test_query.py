import pytest

from applications.models import ApplicationEventSchedule
from tests.factories import ApplicationEventFactory, ApplicationFactory
from tests.test_graphql_api.test_application_event.helpers import events_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


def test_can_query_application_event__all_fields(graphql):
    # given:
    # - There is draft application in an open application round with two application events
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    event_1 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    schedule_1: ApplicationEventSchedule = event_1.application_event_schedules.first()
    event_2 = ApplicationEventFactory.create_in_status_unallocated(application=application)
    event_2.application_event_schedules.first()
    graphql.force_login(application.user)

    fields = """
        pk
        uuid
        name
        nameFi
        nameEn
        nameSv
        numPersons
        minDuration
        maxDuration
        begin
        end
        eventsPerWeek
        biweekly
        flagged
        application {
            additionalInformation
        }
        ageGroup {
            pk
        }
        purpose {
            nameFi
        }
        eventReservationUnits {
            pk
        }
        applicationEventSchedules {
            day
            begin
            end
            priority
        }
        status
    """

    # when:
    # - User tries to search for application events with all fields
    query = events_query(fields=fields)
    response = graphql(query)

    # then:
    # - The response contains the selected fields from both application events
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "pk": event_1.pk,
        "uuid": str(event_1.uuid),
        "name": event_1.name,
        "nameFi": event_1.name_fi,
        "nameEn": event_1.name_en,
        "nameSv": event_1.name_sv,
        "numPersons": event_1.num_persons,
        "minDuration": int(event_1.min_duration.total_seconds()),
        "maxDuration": int(event_1.max_duration.total_seconds()),
        "begin": event_1.begin.isoformat(),
        "end": event_1.end.isoformat(),
        "eventsPerWeek": event_1.events_per_week,
        "biweekly": event_1.biweekly,
        "flagged": event_1.flagged,
        "application": {
            "additionalInformation": application.additional_information,
        },
        "ageGroup": {
            "pk": event_1.age_group.pk,
        },
        "purpose": {
            "nameFi": event_1.purpose.name_fi,
        },
        "eventReservationUnits": [],
        "applicationEventSchedules": [
            {
                "priority": schedule_1.priority,
                "day": schedule_1.day,
                "begin": schedule_1.begin.isoformat(),
                "end": schedule_1.end.isoformat(),
            },
        ],
        "status": event_1.status.value,
    }
