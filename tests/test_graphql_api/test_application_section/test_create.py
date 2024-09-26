import datetime
from datetime import date

import pytest

from tests.factories import ApplicationFactory
from tests.test_graphql_api.test_application_section.helpers import CREATE_MUTATION, get_application_section_create_data
from tilavarauspalvelu.enums import ApplicationSectionStatusChoice
from tilavarauspalvelu.models import ApplicationSection

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__create(graphql):
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


def test_application_section__create__smaller_max_duration_than_min_duration(graphql):
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


def test_application_section__create__duration_not_multiple_of_30(graphql):
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


def test_application_section__create__two_reservation_unit_options_with_same_preferred_order(graphql):
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
    assert response.field_error_messages() == [
        "Reservation Unit Option #2 has duplicate 'preferred_order' 0 with these Reservation Unit Options: #1"
    ]


def test_application_section__create__reservations_begin_date_not_in_round_reservable_period(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application section
    #   with a reservations begin date outside the application round
    data = get_application_section_create_data(application=application)
    new_date = application.application_round.reservation_period_begin - datetime.timedelta(days=1)
    data["reservationsBeginDate"] = new_date.isoformat()
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the reservations begin date
    assert response.field_error_messages() == [
        "Reservations begin date cannot be before the application round's reservation period begin date.",
    ]


def test_application_section__create__reservations_end_date_not_in_round_reservable_period(graphql):
    # given:
    # - There is draft application in an open application round
    # - The owner of the application is using the system
    application = ApplicationFactory.create_in_status_draft()
    graphql.force_login(application.user)

    # when:
    # - User tries to create a new application section
    #   with a reservations end date outside the application round
    data = get_application_section_create_data(application=application)
    new_date = application.application_round.reservation_period_end + datetime.timedelta(days=1)
    data["reservationsEndDate"] = new_date.isoformat()
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the reservations begin date
    assert response.field_error_messages() == [
        "Reservations end date cannot be after the application round's reservation period end date.",
    ]
