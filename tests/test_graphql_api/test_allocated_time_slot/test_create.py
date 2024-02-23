import datetime

import pytest
from django.utils.timezone import get_default_timezone

from applications.choices import ApplicationSectionStatusChoice, ApplicationStatusChoice, Weekday
from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationUnitFactory,
    SpaceFactory,
    SuitableTimeRangeFactory,
)
from tests.helpers import UserType

from .helpers import CREATE_ALLOCATION, allocation_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_allocated_time_slot__create(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # At this point the application section is still in IN_ALLOCATION status
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The application sections' status is now HANDLED
    assert response.has_errors is False, response

    section.refresh_from_db()
    assert section.status == ApplicationSectionStatusChoice.HANDLED


def test_allocated_time_slot__create__still_in_allocation_if_applied_not_fulfilled(graphql):
    # given:
    # - There is an application section with one approved time slot and two applied reservations per week
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(applied_reservations_per_week=2)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # At this point the application section is still in IN_ALLOCATION status
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The application sections' status is still IN_ALLOCATION
    assert response.has_errors is False, response

    section.refresh_from_db()
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION


@pytest.mark.parametrize(
    "missing_key",
    ["dayOfTheWeek", "beginTime", "endTime", "reservationUnitOption"],
)
def test_allocated_time_slot__create__incomplete_data(graphql, missing_key):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    input_data.pop(missing_key)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are errors in the response (the actual error is not that important)
    assert response.has_errors is True, response


def test_allocated_time_slot__create__application_not_yet_in_allocation(graphql):
    # given:
    # - There is an open application that has been sent, but is not allocatable yet
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert application.status == ApplicationStatusChoice.RECEIVED

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == [
        "Cannot allocate to application in status: 'RECEIVED'",
    ]


def test_allocated_time_slot__create__application_not_in_allocation_anymore(graphql):
    # given:
    # - There is an open application that is already allocated
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    assert application.status == ApplicationStatusChoice.HANDLED

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == [
        "Cannot allocate to application section in status: 'HANDLED'",
        "Cannot allocate to application in status: 'HANDLED'",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_duration_longer_than_section_maximum(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but for longer than the maximum allowed duration.
    input_data = allocation_create_data(option, end_time=datetime.time(12, 30), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being too long
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    if not force:
        assert response.field_error_messages("endTime") == [
            "Allocation duration too long. Maximum allowed is 02:00:00 while given duration is 02:30:00."
        ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_duration_shorter_than_section_minimum(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but for shorter than the maximum allowed duration.
    input_data = allocation_create_data(option, end_time=datetime.time(10, 30), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being too short
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    if not force:
        assert response.field_error_messages("endTime") == [
            "Allocation duration too short. Minimum allowed is 01:00:00 while given duration is 00:30:00."
        ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_duration_not_multiple_of_30_minutes(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but not for a multiple of 30 minutes
    input_data = allocation_create_data(option, end_time=datetime.time(11, 0, 1), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being invalid
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    if not force:
        assert response.field_error_messages("endTime") == ["Allocation duration must be a multiple of 30 minutes."]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_more_than_events_per_week(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but users applied reservations per week have already been fulfilled.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(12, 0, 0),
        end_time=datetime.time(14, 0, 0),
        force=force,
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about too many allocations already exising
    assert sorted(response.field_error_messages()) == [
        "Cannot allocate to application in status: 'HANDLED'",
        "Cannot allocate to application section in status: 'HANDLED'",
        "Cannot make more allocations for this application section. Maximum allowed is 1.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_outside_of_suitable_time_ranges(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but it does not fall within the applicants the suitable time ranges.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(14, 0, 0),
        end_time=datetime.time(15, 0, 0),
        force=force,
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being invalid
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    if not force:
        assert response.field_error_messages() == [
            "Given time slot does not fit within applicants suitable time ranges.",
        ]


def test_allocated_time_slot__create__approved_time_falls_on_two_back_to_back_suitable_time_ranges(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(14, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(16, 0, tzinfo=get_default_timezone()),
    )

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   and it falls on two of the applicants the suitable time ranges.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(13, 0),
        end_time=datetime.time(15, 0),
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


def test_allocated_time_slot__create__approved_time_falls_on_two_separated_wished_times(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(15, 0, tzinfo=get_default_timezone()),
        end_time=datetime.time(16, 0, tzinfo=get_default_timezone()),
    )

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   and it falls on two of the applicants the wished periods, but not consecutively.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(13, 0),
        end_time=datetime.time(16, 0),
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the allocated time being invalid.
    assert response.field_error_messages() == [
        "Given time slot does not fit within applicants suitable time ranges.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__reservation_unit_rejected(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    option.rejected = True
    option.save()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but the reservation unit is rejected.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the reservation unit not being included.
    assert response.field_error_messages("reservationUnitOption") == [
        "This reservation unit option has been rejected.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__reservation_unit_locked(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    option.locked = True
    option.save()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but the reservation unit is rejected.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the reservation unit not being included.
    assert response.field_error_messages("reservationUnitOption") == [
        "This reservation unit option has been locked.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__two_allocations_for_same_day(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(
        applied_reservations_per_week=2, pre_allocated=True
    )
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but allocation is on the same day as another allocation for the same section.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(12, 0),
        end_time=datetime.time(14, 0),
        force=force,
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the allocations being on the same day of the week
    assert response.field_error_messages("dayOfTheWeek") == [
        "Cannot make multiple allocations on the same day of the week for one application section."
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__overlapping_with_another_allocation_for_same_reservation_unit(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - There is an overlapping allocation for the same reservation unit
    # - A superuser is using the system
    reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])
    application = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=reservation_unit)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    ApplicationFactory.create_application_ready_for_allocation(reservation_unit=reservation_unit, pre_allocated=True)

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but there is already an allocation for the same reservation unit at that time.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the there being another allocation already.
    assert response.field_error_messages() == [
        "Given time slot has already been allocated for another application section "
        "with a related reservation unit or resource.",
    ]


def test_allocated_time_slot__create__overlapping_with_another_allocation_for_different_reservation_unit(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - There is an overlapping allocation for a different reservation unit
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__overlapping_in_related_reservation_unit(graphql, force):
    # given:
    # - There are two reservation units, one being a child of the other
    # - There is an allocatable reservation unit option for the parent unit
    # - There is an overlapping allocation for the child unit
    # - A superuser is using the system
    parent_space = SpaceFactory.create()
    child_space = SpaceFactory.create(parent=parent_space)
    parent_unit = ReservationUnitFactory.create(spaces=[parent_space])
    child_unit = ReservationUnitFactory.create(spaces=[child_space])

    application = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=parent_unit)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    ApplicationFactory.create_application_ready_for_allocation(reservation_unit=child_unit, pre_allocated=True)
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but there is already an allocation for the child unit.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the there being another allocation already.
    assert response.field_error_messages() == [
        "Given time slot has already been allocated for another application section "
        "with a related reservation unit or resource.",
    ]