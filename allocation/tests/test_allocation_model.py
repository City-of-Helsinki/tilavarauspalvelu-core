import datetime
from unittest import mock

import pytest
from assertpy import assert_that
from django.conf import settings
from django.utils import timezone

from allocation.allocation_data_builder import AllocationDataBuilder
from allocation.allocation_models import ALLOCATION_PRECISION
from allocation.tests.conftest import get_default_end, get_default_start
from applications.models import ApplicationStatus
from opening_hours.hours import TimeElement


def every_second_day(p_start, p_end):
    dates = []
    start = p_start
    delta = datetime.timedelta(days=2)
    while start <= p_end:
        dates.append(start)
        start += delta
    return dates


def get_opening_hour_data(*args, **kwargs):
    if len(args) < 3:
        return []
    (id, start, end) = args
    dates = every_second_day(start, end)
    response = []
    for date in dates:
        response.append(
            {
                "resource_id": id,
                "date": date,
                "times": [
                    TimeElement(
                        start_time=datetime.time(
                            hour=14, tzinfo=timezone.get_default_timezone()
                        ),
                        end_time=datetime.time(
                            hour=18, tzinfo=timezone.get_default_timezone()
                        ),
                        end_time_on_next_day=False,
                    )
                ],
            }
        )
    return response


@mock.patch(
    "allocation.allocation_data_builder.get_opening_hours",
    side_effect=get_opening_hour_data,
)
@pytest.mark.django_db
def test_should_map_application_round_dates(
    mocked_opening_hours, application_round_with_reservation_units
):
    mocked_opening_hours()
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.period_start).is_equal_to(get_default_start())
    assert_that(data.period_end).is_equal_to(get_default_end())


@pytest.mark.django_db
def test_should_map_reservation_unit_open_times_with_mock_data(
    application_with_reservation_units, application_round_with_reservation_units
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    times = [
        [available.start, available.end]
        for available in data.spaces[
            application_round_with_reservation_units.reservation_units.all()[0].id
        ].available_times.values()
    ]

    # Open every day in application period from 10.00 to 22.00
    expected = [
        [
            round((i * 24 + 10) * 60 // ALLOCATION_PRECISION),
            round((i * 24 + 22) * 60 // ALLOCATION_PRECISION),
        ]
        for i in range(31)
    ]
    assert_that(times).is_equal_to(expected)


@mock.patch(
    "allocation.allocation_data_builder.get_opening_hours",
    side_effect=get_opening_hour_data,
)
@pytest.mark.django_db
def test_should_map_reservation_unit_open_times_from_hauki(
    application_with_reservation_units, application_round_with_reservation_units
):

    settings.HAUKI_API_URL = "http://test.com"
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    times = [
        [available.start, available.end]
        for available in data.spaces[
            application_round_with_reservation_units.reservation_units.all()[0].id
        ].available_times.values()
    ]

    # Open every second day from 14 to 18
    expected = [
        [
            round((i * 24 + 14) * 60 // ALLOCATION_PRECISION),
            round((i * 24 + 18) * 60 // ALLOCATION_PRECISION),
        ]
        for i in range(31)
        if i % 2 == 0
    ]
    assert_that(times).is_equal_to(expected)


@pytest.mark.django_db
def test_should_map_application_events(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    dates = []
    start = datetime.datetime(2020, 1, 6, 10, 0)
    delta = datetime.timedelta(days=7)
    while start <= datetime.datetime(2020, 2, 24, 10, 0):
        dates.append(start)
        start += delta

    assert_that(
        data.baskets[None].events[0].occurrences[scheduled_for_monday.id]
    ).has_occurrences(dates).has_weekday(0)

    assert_that(data.baskets[None].events[0]).has_id(recurring_application_event.id)

    hour = 60 // ALLOCATION_PRECISION
    assert_that(data.baskets[None].events[0]).has_min_duration(hour).has_max_duration(
        hour * 2
    )


@pytest.mark.django_db
def test_should_exclude_already_accepted_schedules(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
    result_scheduled_for_monday,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events[0].occurrences).is_empty()


@pytest.mark.django_db
def test_should_map_units_to_spaces(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    matching_event_reservation_unit,
    scheduled_for_monday,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events[0].space_ids).is_equal_to(
        [matching_event_reservation_unit.reservation_unit.id]
    )


@pytest.mark.django_db
def test_should_exclude_declined_units(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    matching_event_reservation_unit,
    scheduled_for_monday,
):

    recurring_application_event.declined_reservation_units.set(
        [matching_event_reservation_unit.reservation_unit]
    )
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events[0].space_ids).is_equal_to([])


@pytest.mark.django_db
def test_should_handle_none_max_duration(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    recurring_application_event.max_duration = None

    recurring_application_event.save()
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    hour = 60 // ALLOCATION_PRECISION
    assert_that(data.baskets[None].events[0]).has_min_duration(hour).has_max_duration(
        hour
    )


@pytest.mark.django_db
def test_should_map_period_start_and_end_from_application_round(
    application_round_with_reservation_units,
    application_with_reservation_units,
    recurring_application_event,
    scheduled_for_monday,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events[0]).has_period_start(
        application_with_reservation_units.application_round.reservation_period_begin
    ).has_period_end(
        application_with_reservation_units.application_round.reservation_period_end
    )


@pytest.mark.django_db
def test_mapping_application_round_baskets(
    application_round_with_reservation_units,
    default_application_round,
    application_round_basket_one,
    application_round_basket_two,
    recurring_application_event,
):

    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets).contains_key(
        application_round_basket_one.id, application_round_basket_two.id
    )

    assert_that(data.baskets[application_round_basket_one.id]).has_id(
        application_round_basket_one.id
    ).has_order_number(
        application_round_basket_one.order_number
    ).has_allocation_percentage(
        application_round_basket_one.allocation_percentage
    )
    assert_that(data.baskets[application_round_basket_two.id]).has_id(
        application_round_basket_two.id
    ).has_order_number(
        application_round_basket_two.order_number
    ).has_allocation_percentage(
        application_round_basket_two.allocation_percentage
    )


@pytest.mark.parametrize(
    "application_status",
    [ApplicationStatus.CANCELLED, ApplicationStatus.DECLINED],
)
@pytest.mark.django_db
def test_should_exclude_cancelled_and_declined_applications(
    application_status,
    application_round_with_reservation_units,
    recurring_application_event,
):

    recurring_application_event.application.status = application_status
    recurring_application_event.application.save()
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events).is_empty()


@pytest.mark.parametrize(
    "application_status",
    [ApplicationStatus.IN_REVIEW, ApplicationStatus.REVIEW_DONE],
)
@pytest.mark.django_db
def test_should_include_not_cancelled_or_declined_applications(
    application_status,
    application_round_with_reservation_units,
    recurring_application_event,
):

    recurring_application_event.application.status = application_status
    recurring_application_event.application.save()
    data = AllocationDataBuilder(
        application_round=application_round_with_reservation_units
    ).get_allocation_data()

    assert_that(data.baskets[None].events).is_length(1)
