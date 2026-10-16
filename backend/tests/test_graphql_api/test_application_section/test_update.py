from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import ApplicationSectionStatusChoice
from tilavarauspalvelu.models import Application, ApplicationSection, ReservationUnitOption, SuitableTimeRange
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationSectionFactory,
    ReservationUnitOptionFactory,
    SuitableTimeRangeFactory,
)
from tests.test_graphql_api.test_application_section.helpers import UPDATE_MUTATION, get_application_section_update_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Update ──


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
    assert section.reservations_begin_date == datetime.date.fromisoformat(data["reservationsBeginDate"])
    assert section.reservations_end_date == datetime.date.fromisoformat(data["reservationsEndDate"])
    assert section.applied_reservations_per_week == data["appliedReservationsPerWeek"]

    assert section.suitable_time_ranges.count() == 1
    assert section.reservation_unit_options.count() == 1

    assert section.status == ApplicationSectionStatusChoice.UNALLOCATED


# ── Application sent at ──


def test_application_section__update__resets_application_sent_at(graphql):
    application_section = ApplicationSectionFactory.create_in_status_unallocated(application__sent_at=local_datetime())

    graphql.force_login(application_section.application.user)

    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    application = Application.objects.get(pk=application_section.application.pk)
    assert application.sent_at is None


def test_application_section__update__staff__does_not_reset_application_sent_at(graphql):
    sent_at = local_datetime()
    application_section = ApplicationSectionFactory.create_in_status_unallocated(application__sent_at=sent_at)

    graphql.login_with_superuser()

    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    application = Application.objects.get(pk=application_section.application.pk)
    assert application.sent_at == sent_at


# ── Application round ──


def test_application_section__update__application_round_not_open(graphql):
    application_section = ApplicationSectionFactory.create_in_status_in_allocation()
    original_name = application_section.name

    graphql.login_with_superuser()

    data = get_application_section_update_data(application_section=application_section)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not open for applications"]

    application_section = ApplicationSection.objects.get(pk=application_section.pk)
    assert application_section.name == original_name


# ── Objects of other applications and sections ──


def test_application_section__update__move_to_another_application(graphql):
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    own_application_pk = application_section.application.pk
    other_application = ApplicationFactory.create_in_status_draft()

    graphql.force_login(application_section.application.user)

    data = get_application_section_update_data(application_section=application_section)
    data["application"] = other_application.pk
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application section cannot be moved to another application."]

    application_section = ApplicationSection.objects.get(pk=application_section.pk)
    assert application_section.application.pk == own_application_pk


def test_application_section__update__reservation_unit_option_of_another_section(graphql):
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    other_section = ApplicationSectionFactory.create_in_status_unallocated()
    other_option = other_section.reservation_unit_options.first()

    graphql.force_login(application_section.application.user)

    data = get_application_section_update_data(application_section=application_section)
    data["reservationUnitOptions"] = [{"pk": other_option.pk, "preferredOrder": 0}]
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        f"Reservation unit option {other_option.pk} does not belong to this application section.",
    ]

    other_option = ReservationUnitOption.objects.get(pk=other_option.pk)
    assert other_option.application_section.pk == other_section.pk


def test_application_section__update__suitable_time_range_of_another_section(graphql):
    application_section = ApplicationSectionFactory.create_in_status_unallocated()
    other_section = ApplicationSectionFactory.create_in_status_unallocated()
    other_time_range = SuitableTimeRangeFactory.create(application_section=other_section)

    graphql.force_login(application_section.application.user)

    data = get_application_section_update_data(application_section=application_section)
    data["suitableTimeRanges"] = [{"pk": other_time_range.pk}]
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        f"Suitable time range {other_time_range.pk} does not belong to this application section.",
    ]

    other_time_range = SuitableTimeRange.objects.get(pk=other_time_range.pk)
    assert other_time_range.application_section.pk == other_section.pk


# ── Validation ──


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
        (
            f"Reservation Unit Option {option_2.pk} has duplicate 'preferred_order' 0 "
            f"with these Reservation Unit Options: {option_1.pk}"
        ),
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
    new_date = application_section.application.application_round.reservation_period_begin_date - datetime.timedelta(
        days=1
    )
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
    new_date = application_section.application.application_round.reservation_period_end_date + datetime.timedelta(
        days=1
    )
    data["reservationsEndDate"] = new_date.isoformat()
    response = graphql(UPDATE_MUTATION, input_data=data)

    # then:
    # - The response contains errors about reservations end date
    assert response.field_error_messages() == [
        "Reservations end date cannot be after the application round's reservation period end date.",
    ]
