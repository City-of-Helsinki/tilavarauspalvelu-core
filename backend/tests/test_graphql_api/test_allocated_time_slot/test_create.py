from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.enums import (
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
    ReservationStartInterval,
    Weekday,
)
from tilavarauspalvelu.models import AllocatedTimeSlot, ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationUnitFactory,
    ReservationUnitOptionFactory,
    SpaceFactory,
    SuitableTimeRangeFactory,
)

from .helpers import CREATE_ALLOCATION, allocation_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Create ──


def test_allocated_time_slot__create(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    # At this point the application section is still in IN_ALLOCATION status
    assert section.status == ApplicationSectionStatusChoice.IN_ALLOCATION

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The allocated time slot was created with the given values
    # - The application sections' status is now HANDLED
    assert response.has_errors is False, response

    slot = AllocatedTimeSlot.objects.get(reservation_unit_option=option)
    assert slot.day_of_the_week == Weekday.MONDAY
    assert slot.begin_time == datetime.time(10, 0)
    assert slot.end_time == datetime.time(12, 0)

    section.refresh_from_db()
    assert section.status == ApplicationSectionStatusChoice.HANDLED


def test_allocated_time_slot__create__still_in_allocation_if_applied_not_fulfilled(graphql):
    # given:
    # - There is an application section with one approved time slot and two applied reservations per week
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(applied_reservations_per_week=2)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

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
    ("missing_key", "required_type"),
    [
        ("dayOfTheWeek", "Weekday!"),
        ("beginTime", "Time!"),
        ("endTime", "Time!"),
        ("reservationUnitOption", "Int!"),
    ],
)
def test_allocated_time_slot__create__incomplete_data(graphql, missing_key, required_type):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    input_data.pop(missing_key)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the missing input field
    assert response.has_errors is True, response

    given_value = {
        "dayOfTheWeek": "MONDAY",
        "beginTime": "10:00:00",
        "endTime": "12:00:00",
        "reservationUnitOption": option.pk,
        "force": False,
    }
    given_value.pop(missing_key)
    assert response.error_message() == (
        f"Variable '$input' got invalid value {given_value}; "
        f"Field '{missing_key}' of required type '{required_type}' was not provided."
    )
    assert option.allocated_time_slots.count() == 0


def test_allocated_time_slot__create__application_not_yet_in_allocation(graphql):
    # given:
    # - There is an open application that has been sent, but is not allocatable yet
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_upcoming()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

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


def test_allocated_time_slot__create__application_not_in_allocation_anymore__HANDLED(graphql):
    # given:
    # - There is an open application that is already allocated
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round, pre_allocated=True)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    assert application.status == ApplicationStatusChoice.HANDLED
    assert section.status == ApplicationSectionStatusChoice.HANDLED

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == ["Cannot allocate to application section in status: 'HANDLED'"]


def test_allocated_time_slot__create__application_not_in_allocation_anymore__REJECTED(graphql):
    # given:
    # - There is an open application that is already allocated
    # - A superuser is using the system
    application_round = ApplicationRoundFactory.create_in_status_handled()
    application = ApplicationFactory.create_application_ready_for_allocation(application_round)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    option.is_rejected = True
    option.save()
    graphql.login_with_superuser()

    assert application.status == ApplicationStatusChoice.HANDLED
    assert section.status == ApplicationSectionStatusChoice.REJECTED

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the application being in the wrong status
    assert response.field_error_messages() == ["Cannot allocate to application section in status: 'REJECTED'"]


# ── Duration and start times ──


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_duration_longer_than_section_maximum(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but for longer than the maximum allowed duration.
    input_data = allocation_create_data(option, end_time=datetime.time(12, 30), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being too long
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    assert option.allocated_time_slots.count() == (1 if force else 0)

    if not force:
        assert response.field_error_messages() == [
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
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but for shorter than the maximum allowed duration.
    input_data = allocation_create_data(option, end_time=datetime.time(10, 30), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - If force=False -> The response complains about the duration being too short
    # - If force=True -> The allocation is successful
    assert response.has_errors is (not force)
    assert option.allocated_time_slots.count() == (1 if force else 0)

    if not force:
        assert response.field_error_messages() == [
            "Allocation duration too short. Minimum allowed is 01:00:00 while given duration is 00:30:00."
        ]


def test_allocated_time_slot__create__approve_times_at_15_minute_steps(graphql):
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    option.reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_15_MINUTES
    option.reservation_unit.save()
    graphql.login_with_superuser()

    input_data = allocation_create_data(option, begin_time=datetime.time(10, 15), end_time=datetime.time(11, 30))
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.has_errors is False, response

    slot = AllocatedTimeSlot.objects.get(reservation_unit_option=option)
    assert slot.begin_time == datetime.time(10, 15)
    assert slot.end_time == datetime.time(11, 30)


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_times_not_multiple_of_15_minutes(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but the end time is not at a 15 minute step
    input_data = allocation_create_data(option, end_time=datetime.time(11, 10), force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the times being invalid, even if forced
    assert response.field_error_messages() == [
        "Allocation begin and end times must be multiples of 15 minutes.",
    ]
    assert option.allocated_time_slots.count() == 0


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_begin_time_not_matching_start_interval(graphql, force):
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    option.reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES
    option.reservation_unit.save()
    graphql.login_with_superuser()

    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(10, 15),
        end_time=datetime.time(11, 15),
        force=force,
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.field_error_messages() == [
        "Allocation begin time does not match the allowed start interval of the reservation unit.",
    ]
    assert option.allocated_time_slots.count() == 0


# ── Events per week ──


@pytest.mark.parametrize("force", [True, False])
@pytest.mark.parametrize(
    ("begin_time", "end_time"),
    [
        (datetime.time(12, 0), datetime.time(10, 0)),
        (datetime.time(22, 0), datetime.time(0, 30)),
    ],
)
def test_allocated_time_slot__create__approve_begin_time_after_end_time(graphql, force, begin_time, end_time):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation that ends before it begins on the same day
    input_data = allocation_create_data(option, begin_time=begin_time, end_time=end_time, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the times being invalid, even if forced
    # - No allocation is made
    assert response.field_error_messages() == [
        "Allocation begin time must be before its end time.",
    ]
    assert AllocatedTimeSlot.objects.count() == 0


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_more_than_events_per_week(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

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
        # There is a separate check for the number of allocations per week
        # but since the application section status is tied to the number of allocations,
        # this message is what is given first.
        "Cannot allocate to application section in status: 'HANDLED'",
    ]


# ── Suitable time ranges ──


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__approve_outside_of_suitable_time_ranges(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

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
    assert option.allocated_time_slots.count() == (1 if force else 0)

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
    graphql.login_with_superuser()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(14, 0, tzinfo=DEFAULT_TIMEZONE),
        end_time=datetime.time(16, 0, tzinfo=DEFAULT_TIMEZONE),
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
    assert option.allocated_time_slots.count() == 1


def test_allocated_time_slot__create__suitable_time_range_ends_at_midnight(graphql):
    application = ApplicationFactory.create_application_ready_for_allocation(times_slots_to_create=0)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(18, 0),
        end_time=datetime.time(0, 0),
    )

    input_data = allocation_create_data(option, begin_time=datetime.time(21, 0), end_time=datetime.time(23, 0))
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.has_errors is False, response
    assert option.allocated_time_slots.count() == 1


def test_allocated_time_slot__create__allocation_ends_at_midnight__outside_of_suitable_time_ranges(graphql):
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    input_data = allocation_create_data(option, begin_time=datetime.time(22, 0), end_time=datetime.time(0, 0))
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.field_error_messages() == [
        "Given time slot does not fit within applicants suitable time ranges.",
    ]
    assert option.allocated_time_slots.count() == 0


def test_allocated_time_slot__create__approved_time_falls_on_two_separated_wished_times(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    graphql.login_with_superuser()

    SuitableTimeRangeFactory.create(
        application_section=section,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(15, 0, tzinfo=DEFAULT_TIMEZONE),
        end_time=datetime.time(16, 0, tzinfo=DEFAULT_TIMEZONE),
    )

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   and it falls on two of the applicants the wished periods, but not consecutively.
    input_data = allocation_create_data(
        option,
        begin_time=datetime.time(13, 30),
        end_time=datetime.time(15, 30),
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the allocated time being invalid.
    assert response.field_error_messages() == [
        "Given time slot does not fit within applicants suitable time ranges.",
    ]


# ── Reservation unit option state ──


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__reservation_unit_rejected(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    ReservationUnitOptionFactory.create(application_section=section)
    option = section.reservation_unit_options.first()
    option.is_rejected = True
    option.save()

    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but the reservation unit is rejected.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the reservation unit not being included.
    assert response.field_error_messages() == [
        "This reservation unit option has been rejected.",
    ]


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__reservation_unit_locked(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    ReservationUnitOptionFactory.create(application_section=section)
    option = section.reservation_unit_options.first()
    option.is_locked = True
    option.save()

    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but the reservation unit option is locked.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the reservation unit option being locked.
    assert response.field_error_messages() == [
        "This reservation unit option has been locked.",
    ]


# ── Same day and overlapping allocations ──


@pytest.mark.parametrize("force", [True, False])
def test_allocated_time_slot__create__two_allocations_for_same_day(graphql, force):
    # given:
    # - There is an allocatable reservation unit option
    # - The application section already has an allocation on Monday
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation(applied_reservations_per_week=2)
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()

    AllocatedTimeSlotFactory.create(
        reservation_unit_option=option,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(10, 0, tzinfo=DEFAULT_TIMEZONE),
        end_time=datetime.time(12, 0, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_with_superuser()

    # when:
    # - The user tries to make another allocation for the same section on Monday
    input_data = allocation_create_data(
        option,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(12, 0),
        end_time=datetime.time(14, 0),
        force=force,
    )
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - There are no errors in the response
    # - The application section is now HANDLED
    assert response.has_errors is False, response

    section.refresh_from_db()
    assert section.status == ApplicationSectionStatusChoice.HANDLED


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
    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but there is already an allocation for the same reservation unit at that time.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the there being another allocation already.
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]


@pytest.mark.parametrize(
    ("existing_begin_time", "existing_end_time", "new_begin_time", "new_end_time"),
    [
        (datetime.time(20, 0), datetime.time(0, 0), datetime.time(21, 0), datetime.time(22, 0)),
        (datetime.time(21, 0), datetime.time(22, 0), datetime.time(20, 0), datetime.time(0, 0)),
    ],
)
def test_allocated_time_slot__create__overlapping_with_another_allocation__ends_at_midnight(
    graphql,
    existing_begin_time,
    existing_end_time,
    new_begin_time,
    new_end_time,
):
    reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])
    application = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=reservation_unit)
    option = application.application_sections.first().reservation_unit_options.first()

    other_application = ApplicationFactory.create_application_ready_for_allocation(reservation_unit=reservation_unit)
    other_option = other_application.application_sections.first().reservation_unit_options.first()
    AllocatedTimeSlotFactory.create(
        reservation_unit_option=other_option,
        day_of_the_week=Weekday.MONDAY,
        begin_time=existing_begin_time,
        end_time=existing_end_time,
    )
    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    input_data = allocation_create_data(option, begin_time=new_begin_time, end_time=new_end_time, force=True)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]
    assert option.allocated_time_slots.count() == 0


def test_allocated_time_slot__create__overlapping_with_another_allocation__sections_share_a_date(graphql):
    shared_monday = datetime.date(2030, 1, 7)
    reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])
    application = ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=reservation_unit,
        begin_date=shared_monday,
        end_date=shared_monday + datetime.timedelta(days=7),
    )
    option = application.application_sections.first().reservation_unit_options.first()

    ApplicationFactory.create_application_ready_for_allocation(
        reservation_unit=reservation_unit,
        begin_date=shared_monday - datetime.timedelta(days=7),
        end_date=shared_monday,
        pre_allocated=True,
    )
    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]
    assert option.allocated_time_slots.count() == 0


def test_allocated_time_slot__create__overlapping_with_another_allocation_for_different_reservation_unit(graphql):
    # given:
    # - There is an allocatable reservation unit option
    # - There is an overlapping allocation for a different reservation unit
    # - A superuser is using the system
    application = ApplicationFactory.create_application_ready_for_allocation()
    section = application.application_sections.first()
    option = section.reservation_unit_options.first()
    ApplicationFactory.create_application_ready_for_allocation(pre_allocated=True)
    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option
    input_data = allocation_create_data(option)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The allocation is successful
    assert response.has_errors is False, response
    assert option.allocated_time_slots.count() == 1


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
    ReservationUnitHierarchy.refresh()

    graphql.login_with_superuser()

    # when:
    # - The user tries to make an allocation for a reservation unit option,
    #   but there is already an allocation for the child unit.
    input_data = allocation_create_data(option, force=force)
    response = graphql(CREATE_ALLOCATION, input_data=input_data)

    # then:
    # - The response complains about the there being another allocation already.
    assert response.field_error_messages() == [
        (
            "Given time slot has already been allocated for another application section "
            "with a related reservation unit or resource."
        ),
    ]
