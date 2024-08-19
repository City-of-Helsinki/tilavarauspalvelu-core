import datetime
from datetime import date

import pytest

from applications.enums import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from tests.factories import ApplicationSectionFactory, ReservationUnitOptionFactory
from tests.test_graphql_api.test_application_section.helpers import UPDATE_MUTATION, get_application_section_update_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_application_section__update(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section
    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The database contains the created application section
    # - The fields on the application section correspond to the creation request
    # - The application section is in status UNALLOCATED
    assert response.has_errors is False, response

    application_sections: list[ApplicationSection] = list(ApplicationSection.objects.all())
    assert len(application_sections) == 1

    section = application_sections[0]

    assert section.name == data["name"]
    assert section.num_persons == data["numPersons"]
    assert section.application == application_section.application
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


def test_application_section__update__smaller_max_duration_than_min_duration(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section with a smaller max duration than min duration
    data = get_application_section_update_data(application_section=application_section)
    data["reservationMaxDuration"] = int(datetime.timedelta(minutes=30).total_seconds())
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains an error about the max duration
    assert response.field_error_messages() == [
        "Reservation min duration cannot be greater than reservation max duration.",
    ], response


def test_application_section__update__switch_reservation_unit_option_preferred_order(graphql):
    # given:
    # - There is an application section with two reservation unit options
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=[])
    option_1 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=0)
    option_2 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=1)
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section, switching the preferred order of the reservation unit options
    data = {
        "pk": application_section.pk,
        "reservationUnitOptions": [
            {
                "pk": option_1.pk,
                "preferredOrder": option_2.preferred_order,
            },
            {
                "pk": option_2.pk,
                "preferredOrder": option_1.preferred_order,
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains no errors
    # - The preferred order between the two reservation unit options has been switched
    assert response.has_errors is False, response
    option_1.refresh_from_db()
    option_2.refresh_from_db()
    assert option_1.preferred_order == 1
    assert option_2.preferred_order == 0


def test_application_section__update__two_reservation_unit_options_with_same_preferred_order(graphql):
    # given:
    # - There is an application section with two reservation unit options
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=[])
    option_1 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=0)
    option_2 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=1)
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section, switching the preferred order of the reservation unit options
    data = {
        "pk": application_section.pk,
        "reservationUnitOptions": [
            {
                "pk": option_1.pk,
                "preferredOrder": option_1.preferred_order,
            },
            {
                "pk": option_2.pk,
                "preferredOrder": option_1.preferred_order,
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about duplicate preferred order
    assert response.field_error_messages() == [
        f"Reservation Unit Option {option_2.pk} has duplicate 'preferred_order' 0 "
        f"with these Reservation Unit Options: {option_1.pk}",
    ], response


def test_application_section__update__preferred_order_must_be_consecutive(graphql):
    # given:
    # - There is an application section with two event reservation units
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated(reservation_unit_options=[])
    event_unit_1 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=0)
    event_unit_2 = ReservationUnitOptionFactory.create(application_section=application_section, preferred_order=1)
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section, making the event reservation unit preferred order nonconsecutive
    data = {
        "pk": application_section.pk,
        "reservationUnitOptions": [
            {
                "pk": event_unit_1.pk,
            },
            {
                "pk": event_unit_2.pk,
                "preferredOrder": 2,
            },
        ],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about preferred order not being consecutive
    assert response.field_error_messages() == [
        f"Reservation Unit Option {event_unit_2.pk} has 'preferred_order' 2 but should be 1"
    ], response


def test_application_section__update__reservations_begin_date_not_in_round_reservable_period(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section
    #   with a reservations begin date outside the application round
    data = get_application_section_update_data(application_section=application_section)
    new_date = application_section.application.application_round.reservation_period_begin - datetime.timedelta(days=1)
    data["reservationsBeginDate"] = new_date.isoformat()
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about reservations begin date
    assert response.field_error_messages() == [
        "Reservations begin date cannot be before the application round's reservation period begin date.",
    ]


def test_application_section__update__reservations_end_date_not_in_round_reservable_period(graphql):
    # given:
    # - There is an unallocated application section in a draft application in an open application round
    # - A superuser is using the system
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    graphql.login_with_superuser()

    # when:
    # - User tries to update the application section
    #   with a reservations end date outside the application round
    data = get_application_section_update_data(application_section=application_section)
    new_date = application_section.application.application_round.reservation_period_end + datetime.timedelta(days=1)
    data["reservationsEndDate"] = new_date.isoformat()
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about reservations end date
    assert response.field_error_messages() == [
        "Reservations end date cannot be after the application round's reservation period end date.",
    ]
