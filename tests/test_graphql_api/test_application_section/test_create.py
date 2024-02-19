import datetime
from datetime import date

import pytest

from applications.choices import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from tests.factories import ApplicationFactory
from tests.test_graphql_api.test_application_section.helpers import CREATE_MUTATION, get_application_section_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_create_application_section(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft_no_sections()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application section
    data = get_application_section_create_data(application=application)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application section
    # - The fields on the application event correspond to the creation request
    # - The application section is in status UNALLOCATED
    assert response.has_errors is False, response

    application_sections: list[ApplicationSection] = list(ApplicationSection.objects.all())
    assert len(application_sections) == 1

    section = application_sections[0]

    assert section.name == data["name"]
    assert section.num_persons == data["numPersons"]
    assert section.application == application
    assert section.age_group_id == data["ageGroup"]
    assert section.purpose_id == data["purpose"]
    assert section.reservation_min_duration == datetime.timedelta(seconds=data["reservationMinDuration"])
    assert section.reservation_max_duration == datetime.timedelta(seconds=data["reservationMaxDuration"])
    assert section.reservations_begin_date == date.fromisoformat(data["reservationsBeginDate"])
    assert section.reservations_end_date == date.fromisoformat(data["reservationsEndDate"])
    assert section.applied_reservations_per_week == data["appliedReservationsPerWeek"]

    assert section.suitable_time_ranges.count() == 1
    assert section.reservation_unit_options.count() == 1

    assert section.status == ApplicationSectionStatusChoice.UNALLOCATED


def test_create_application_section__smaller_max_duration_than_min_duration(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application event with a smaller max duration than min duration
    data = get_application_section_create_data(application=application)
    data["reservationMaxDuration"] = int(datetime.timedelta(minutes=30).total_seconds())
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the max duration
    assert response.field_error_messages() == [
        "Reservation min duration cannot be greater than reservation max duration.",
    ]


def test_create_application_section__duration_not_multiple_of_30(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application event with a smaller max duration than min duration
    data = get_application_section_create_data(application=application)
    data["reservationMaxDuration"] = int(datetime.timedelta(hours=2, seconds=1).total_seconds())
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the max duration
    assert response.field_error_messages() == [
        "Reservation min and max durations must be multiples of 30 minutes, up to a maximum of 24 hours.",
    ]


def test_create_application_section__two_reservation_unit_options_with_same_preferred_order(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to update the application event, switching the preferred order of the event reservation units
    data = get_application_section_create_data(application=application)
    data["reservationUnitOptions"] = [
        {
            "preferredOrder": 0,
            "reservationUnit": data["reservationUnitOptions"][0]["reservationUnit"],
        },
        {
            "preferredOrder": 0,
            "reservationUnit": data["reservationUnitOptions"][0]["reservationUnit"],
        },
    ]
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about violating unique constraint
    assert response.has_errors is True, response
    assert response.field_error_messages("reservationUnitOptions") == [
        "Reservation Unit Option #2 has duplicate 'preferred_order' 0 with these Reservation Unit Options: #1"
    ]
