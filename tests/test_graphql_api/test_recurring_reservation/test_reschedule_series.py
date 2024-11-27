from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ReservationStateChoice, WeekdayChoice
from tilavarauspalvelu.models import AffectingTimeSpan, ReservationStatistic, ReservationUnitHierarchy
from tilavarauspalvelu.tasks import create_or_update_reservation_statistics
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_date, local_datetime, local_time

from tests.factories import RecurringReservationFactory, ReservationFactory

from .helpers import RESCHEDULE_SERIES_MUTATION, create_reservation_series, get_minimal_reschedule_data

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_begin_date(graphql):
    recurring_reservation = create_reservation_series()

    # Change begin date to the next Tuesday.
    # This should remove the first reservation from the series.
    data = get_minimal_reschedule_data(recurring_reservation, beginDate="2023-12-05")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series starts from 11th instead of 4th.
    recurring_reservation.refresh_from_db()
    recurring_reservation.begin_date = local_date(year=2023, month=12, day=11)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 8
    assert reservations[0].begin.date() == local_date(year=2023, month=12, day=11)
    assert reservations[1].begin.date() == local_date(year=2023, month=12, day=18)
    assert reservations[2].begin.date() == local_date(year=2023, month=12, day=25)
    assert reservations[3].begin.date() == local_date(year=2024, month=1, day=1)
    assert reservations[4].begin.date() == local_date(year=2024, month=1, day=8)
    assert reservations[5].begin.date() == local_date(year=2024, month=1, day=15)
    assert reservations[6].begin.date() == local_date(year=2024, month=1, day=22)
    assert reservations[7].begin.date() == local_date(year=2024, month=1, day=29)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_begin_time(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series entries start at 8:00 instead of 10:00.
    recurring_reservation.refresh_from_db()
    assert recurring_reservation.begin_time == local_time(hour=8)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[2].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[3].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[4].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[5].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[6].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[7].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[8].begin.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_end_date(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(
        recurring_reservation,
        # Change end date to the previous Sunday.
        # This should remove the last reservation from the series.
        endDate="2024-01-28",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series ends on 22nd instead of 29th.
    recurring_reservation.refresh_from_db()
    recurring_reservation.end_date = local_date(year=2024, month=1, day=28)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 8
    assert reservations[0].end.date() == local_date(year=2023, month=12, day=4)
    assert reservations[1].end.date() == local_date(year=2023, month=12, day=11)
    assert reservations[2].end.date() == local_date(year=2023, month=12, day=18)
    assert reservations[3].end.date() == local_date(year=2023, month=12, day=25)
    assert reservations[4].end.date() == local_date(year=2024, month=1, day=1)
    assert reservations[5].end.date() == local_date(year=2024, month=1, day=8)
    assert reservations[6].end.date() == local_date(year=2024, month=1, day=15)
    assert reservations[7].end.date() == local_date(year=2024, month=1, day=22)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_end_time(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, endTime="14:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series entries ends at 14:00 instead of 12:00.
    recurring_reservation.refresh_from_db()
    assert recurring_reservation.end_time == local_time(hour=14)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[2].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[3].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[4].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[5].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[6].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[7].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[8].end.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Monday
def test_recurring_reservations__reschedule_series__change_begin_date__reservations_in_the_past(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, beginDate="2023-12-05")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation series' begin date cannot be changed after its first reservation's start time is in the past.",
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_weekdays(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, weekdays=[WeekdayChoice.TUESDAY])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series repeat on Tuesdays.
    recurring_reservation.refresh_from_db()
    recurring_reservation.weekdays = f"{WeekdayChoice.TUESDAY}"

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    assert reservations[0].begin.date() == local_date(year=2023, month=12, day=5)
    assert reservations[1].begin.date() == local_date(year=2023, month=12, day=12)
    assert reservations[2].begin.date() == local_date(year=2023, month=12, day=19)
    assert reservations[3].begin.date() == local_date(year=2023, month=12, day=26)
    assert reservations[4].begin.date() == local_date(year=2024, month=1, day=2)
    assert reservations[5].begin.date() == local_date(year=2024, month=1, day=9)
    assert reservations[6].begin.date() == local_date(year=2024, month=1, day=16)
    assert reservations[7].begin.date() == local_date(year=2024, month=1, day=23)
    assert reservations[8].begin.date() == local_date(year=2024, month=1, day=30)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_weekdays__invalid_weekday(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, weekdays=[8])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("weekdays") == ["Invalid weekday: 8."]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__change_buffer_times(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, bufferTimeBefore="00:30:00", bufferTimeAfter="01:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Reservation buffer times are set.
    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    for reservation in reservations:
        assert reservation.buffer_time_before == datetime.timedelta(minutes=30)
        assert reservation.buffer_time_after == datetime.timedelta(hours=1)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__empty_series(graphql):
    recurring_reservation = RecurringReservationFactory.create()

    data = get_minimal_reschedule_data(recurring_reservation)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation series must have at least one future reservation to reschedule",
    ]


@freeze_time(local_datetime(year=2024, month=12, day=1))
def test_recurring_reservations__reschedule_series__all_reservations_in_the_past(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation series must have at least one future reservation to reschedule",
    ]


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Monday
def test_recurring_reservations__reschedule_series__change_part_of_the_series(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    # Start times stay the same for past reservations.
    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=4, hour=10)
    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=11, hour=10)
    assert reservations[2].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=18, hour=10)
    assert reservations[3].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=25, hour=10)
    # Start times change for future reservations.
    assert reservations[4].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=1, hour=8)
    assert reservations[5].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=8, hour=8)
    assert reservations[6].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=15, hour=8)
    assert reservations[7].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=22, hour=8)
    assert reservations[8].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=29, hour=8)


@freeze_time(local_datetime(year=2024, month=1, day=1, hour=11))  # Monday
def test_recurring_reservations__reschedule_series__change_part_of_the_series__during_reservation(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    # Start times stay the same for past reservations.
    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=4, hour=10)
    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=11, hour=10)
    assert reservations[2].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=18, hour=10)
    assert reservations[3].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=25, hour=10)
    # Start time stays the same for ongoing reservation.
    assert reservations[4].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=1, hour=10)
    # Start times change for future reservations.
    assert reservations[5].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=8, hour=8)
    assert reservations[6].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=15, hour=8)
    assert reservations[7].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=22, hour=8)
    assert reservations[8].begin.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=29, hour=8)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
@pytest.mark.parametrize("state", [ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])
def test_recurring_reservations__reschedule_series__dont_remove_unconfirmed_reservations(graphql, state):
    recurring_reservation = create_reservation_series()

    reservation: Reservation = recurring_reservation.reservations.order_by("begin").first()
    reservation.state = state
    reservation.save()

    data = get_minimal_reschedule_data(recurring_reservation, weekdays=[WeekdayChoice.TUESDAY])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 10
    # The unconfirmed reservation is still there.
    assert reservations[0].state == state
    assert reservations[0].begin.date() == local_date(year=2023, month=12, day=4)
    # New reservations start from the new weekday.
    assert reservations[1].state == ReservationStateChoice.CONFIRMED
    assert reservations[1].begin.date() == local_date(year=2023, month=12, day=5)


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Friday
def test_recurring_reservations__reschedule_series__details_from_reservation__use_next(graphql):
    recurring_reservation = create_reservation_series(reservations__name="foo")

    # Change name for the next reservation.
    # This should be enough to determine that we used this reservation's details.
    reservation: Reservation = recurring_reservation.reservations.filter(begin__date=local_date()).first()
    reservation.name = "bar"
    reservation.save()

    data = get_minimal_reschedule_data(recurring_reservation, weekdays=[WeekdayChoice.TUESDAY])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 9
    # Past reservations don't have their details changed.
    assert reservations[0].name == "foo"
    assert reservations[1].name == "foo"
    assert reservations[2].name == "foo"
    assert reservations[3].name == "foo"
    # Future reservations have details from the previously next reservation.
    assert reservations[4].name == "bar"
    assert reservations[5].name == "bar"
    assert reservations[6].name == "bar"
    assert reservations[7].name == "bar"
    assert reservations[8].name == "bar"


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Friday
def test_recurring_reservations__reschedule_series__details_from_reservation__next_is_cancelled(graphql):
    recurring_reservation = create_reservation_series(reservations__name="foo")

    reservations = recurring_reservation.reservations.filter(begin__date__gte=local_date()).iterator()

    # The next reservation is cancelled, so we shouldn't use its details.
    reservation: Reservation = next(reservations)
    reservation.name = "bar"
    reservation.state = ReservationStateChoice.CANCELLED
    reservation.save()

    # The one after that is still going to occur, so we should use its details.
    reservation: Reservation = next(reservations)
    reservation.name = "baz"
    reservation.save()

    data = get_minimal_reschedule_data(recurring_reservation, weekdays=[WeekdayChoice.TUESDAY])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 10
    # Past reservations don't have their details changed.
    assert reservations[0].name == "foo"
    assert reservations[1].name == "foo"
    assert reservations[2].name == "foo"
    assert reservations[3].name == "foo"

    # Cancelled reservations don't have their details changed.
    assert reservations[4].name == "bar"
    assert reservations[4].begin.date() == local_date(year=2024, month=1, day=1)

    # New reservation created since weekdays changed.
    assert reservations[5].name == "baz"
    assert reservations[5].begin.date() == local_date(year=2024, month=1, day=2)

    # Other future reservations have details from the next reservation confirmed reservation.
    assert reservations[6].name == "baz"
    assert reservations[7].name == "baz"
    assert reservations[8].name == "baz"
    assert reservations[9].name == "baz"


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__end_date_before_begin_date(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, endDate="2023-01-01")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Begin date cannot be after end date."]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__end_date_more_than_two_years_into_future(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, endDate="2025-12-02")  # 2 years + 1 day

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Cannot create reservations for more than 2 years in the future.",
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__end_time_before_begin_time__same_day(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(
        recurring_reservation,
        beginDate="2024-01-01",
        endDate="2024-01-01",
        beginTime="08:00:00",
        endTime="07:00:00",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Begin time cannot be after end time if on the same day.",
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__end_time_before_begin_time__different_days(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(
        recurring_reservation,
        beginDate="2024-01-01",
        endDate="2024-01-02",
        beginTime="08:00:00",
        endTime="07:00:00",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    # It's enough to check that the mutation was successful, unlike the tests above.
    assert response.has_errors is False


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__invalid_start_interval(graphql):
    recurring_reservation = create_reservation_series()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:01")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation start time does not match the allowed interval of 15 minutes.",
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__overlapping_reservations(graphql):
    recurring_reservation = create_reservation_series()

    reservation: Reservation = recurring_reservation.reservations.order_by("begin").first()
    begin_date = reservation.begin.date()

    # Add overlapping reservation
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=recurring_reservation.reservation_unit,
        begin=combine(begin_date, local_time(hour=8, minute=0)),
        end=combine(begin_date, local_time(hour=8, minute=30)),
        state=ReservationStateChoice.CONFIRMED,
    )

    # Refresh materialized views so that overlapping reservations are detected.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T08:00:00+02:00",
            "end": "2023-12-04T12:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__overlapping_reservations__buffer_before(graphql):
    recurring_reservation = create_reservation_series(
        reservation_unit__buffer_time_before=datetime.timedelta(minutes=30),
    )

    reservation: Reservation = recurring_reservation.reservations.order_by("begin").first()
    begin_date = reservation.begin.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=recurring_reservation.reservation_unit,
        begin=combine(begin_date, local_time(hour=7, minute=0)),
        end=combine(begin_date, local_time(hour=8, minute=00)),
        state=ReservationStateChoice.CONFIRMED,
    )

    # Refresh materialized views so that overlapping reservations are detected.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T08:00:00+02:00",
            "end": "2023-12-04T12:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__overlapping_reservations__buffer_after(graphql):
    recurring_reservation = create_reservation_series(
        reservation_unit__buffer_time_after=datetime.timedelta(minutes=30),
    )

    reservation: Reservation = recurring_reservation.reservations.order_by("begin").first()
    begin_date = reservation.begin.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=recurring_reservation.reservation_unit,
        begin=combine(begin_date, local_time(hour=13, minute=0)),
        end=combine(begin_date, local_time(hour=14, minute=00)),
        state=ReservationStateChoice.CONFIRMED,
    )

    # Refresh materialized views so that overlapping reservations are detected.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    data = get_minimal_reschedule_data(recurring_reservation, endTime="13:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.error_message() == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T10:00:00+02:00",
            "end": "2023-12-04T13:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__overlapping_reservations__only_buffers(graphql):
    recurring_reservation = create_reservation_series(
        reservation_unit__buffer_time_before=datetime.timedelta(minutes=60),
        reservation_unit__buffer_time_after=datetime.timedelta(minutes=60),
    )

    reservation: Reservation = recurring_reservation.reservations.order_by("begin").first()
    begin_date = reservation.begin.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=recurring_reservation.reservation_unit,
        begin=combine(begin_date, local_time(hour=14, minute=0)),
        end=combine(begin_date, local_time(hour=15, minute=00)),
        state=ReservationStateChoice.CONFIRMED,
    )

    # Refresh materialized views so that overlapping reservations are detected.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    data = get_minimal_reschedule_data(recurring_reservation, endTime="13:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__skip_dates(graphql):
    recurring_reservation = create_reservation_series()

    assert recurring_reservation.reservations.count() == 9

    data = get_minimal_reschedule_data(recurring_reservation, skipDates=["2023-12-04", "2024-01-01"])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # Series is missing the two dates that were skipped.
    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 7
    assert reservations[0].begin.date() == local_date(year=2023, month=12, day=11)
    assert reservations[1].begin.date() == local_date(year=2023, month=12, day=18)
    assert reservations[2].begin.date() == local_date(year=2023, month=12, day=25)
    assert reservations[3].begin.date() == local_date(year=2024, month=1, day=8)
    assert reservations[4].begin.date() == local_date(year=2024, month=1, day=15)
    assert reservations[5].begin.date() == local_date(year=2024, month=1, day=22)
    assert reservations[6].begin.date() == local_date(year=2024, month=1, day=29)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_recurring_reservations__reschedule_series__create_statistics(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    recurring_reservation = create_reservation_series()

    create_or_update_reservation_statistics(recurring_reservation.reservations.values_list("pk", flat=True))

    # We have 9 reservations, so there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    before = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # After rescheduling, there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    # But those statistics should be for different reservations.
    after = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))
    assert before != after


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Friday
def test_recurring_reservations__reschedule_series__create_statistics__partial(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    recurring_reservation = create_reservation_series()

    create_or_update_reservation_statistics(recurring_reservation.reservations.values_list("pk", flat=True))

    # We have 9 reservations, so there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    before = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    data = get_minimal_reschedule_data(recurring_reservation, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    # After rescheduling, there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    # But those statistics should be for different reservations.
    after = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))
    assert before != after
