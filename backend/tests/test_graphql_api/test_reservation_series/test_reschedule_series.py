from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, Weekday
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.keyless_entry.service import PindoraService
from tilavarauspalvelu.models import ReservationStatistic
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, local_time

from tests.factories import ReservationFactory, ReservationSeriesFactory
from tests.helpers import patch_method

from .helpers import RESCHEDULE_SERIES_MUTATION, create_reservation_series, get_minimal_reschedule_data

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_seasonal_booking_rescheduled_series_email)
@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_begin_date(graphql):
    reservation_series = create_reservation_series(allocated_time_slot__day_of_the_week=Weekday.MONDAY)

    # Change begin date to the next Tuesday.
    # This should remove the first reservation from the series.
    data = get_minimal_reschedule_data(reservation_series, beginDate="2023-12-05")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series starts from 11th instead of 4th.
    reservation_series.refresh_from_db()
    reservation_series.begin_date = local_date(year=2023, month=12, day=11)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 8
    assert reservations[0].begins_at.date() == local_date(year=2023, month=12, day=11)
    assert reservations[1].begins_at.date() == local_date(year=2023, month=12, day=18)
    assert reservations[2].begins_at.date() == local_date(year=2023, month=12, day=25)
    assert reservations[3].begins_at.date() == local_date(year=2024, month=1, day=1)
    assert reservations[4].begins_at.date() == local_date(year=2024, month=1, day=8)
    assert reservations[5].begins_at.date() == local_date(year=2024, month=1, day=15)
    assert reservations[6].begins_at.date() == local_date(year=2024, month=1, day=22)
    assert reservations[7].begins_at.date() == local_date(year=2024, month=1, day=29)

    assert EmailService.send_seasonal_booking_rescheduled_series_email.called is True


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_begin_time(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series entries start at 8:00 instead of 10:00.
    reservation_series.refresh_from_db()
    assert reservation_series.begin_time == local_time(hour=8)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[3].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[4].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[5].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[6].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[7].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)
    assert reservations[8].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=8)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_end_date(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(
        reservation_series,
        # Change end date to the previous Sunday.
        # This should remove the last reservation from the series.
        endDate="2024-01-28",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series ends on 22nd instead of 29th.
    reservation_series.refresh_from_db()
    reservation_series.end_date = local_date(year=2024, month=1, day=28)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 8
    assert reservations[0].ends_at.date() == local_date(year=2023, month=12, day=4)
    assert reservations[1].ends_at.date() == local_date(year=2023, month=12, day=11)
    assert reservations[2].ends_at.date() == local_date(year=2023, month=12, day=18)
    assert reservations[3].ends_at.date() == local_date(year=2023, month=12, day=25)
    assert reservations[4].ends_at.date() == local_date(year=2024, month=1, day=1)
    assert reservations[5].ends_at.date() == local_date(year=2024, month=1, day=8)
    assert reservations[6].ends_at.date() == local_date(year=2024, month=1, day=15)
    assert reservations[7].ends_at.date() == local_date(year=2024, month=1, day=22)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_end_time(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, endTime="14:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series entries ends at 14:00 instead of 12:00.
    reservation_series.refresh_from_db()
    assert reservation_series.end_time == local_time(hour=14)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    assert reservations[0].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[1].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[2].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[3].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[4].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[5].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[6].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[7].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)
    assert reservations[8].ends_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=14)


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Monday
def test_reservation_series__reschedule_series__change_begin_date__reservations_in_the_past(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginDate="2023-12-05")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Reservation series' begin date cannot be changed after its first reservation's start time is in the past."
    )


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_weekdays(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, weekdays=[Weekday.TUESDAY.value])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservation_series.refresh_from_db()

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    assert reservations[0].begins_at.date() == local_date(year=2023, month=12, day=5)
    assert reservations[1].begins_at.date() == local_date(year=2023, month=12, day=12)
    assert reservations[2].begins_at.date() == local_date(year=2023, month=12, day=19)
    assert reservations[3].begins_at.date() == local_date(year=2023, month=12, day=26)
    assert reservations[4].begins_at.date() == local_date(year=2024, month=1, day=2)
    assert reservations[5].begins_at.date() == local_date(year=2024, month=1, day=9)
    assert reservations[6].begins_at.date() == local_date(year=2024, month=1, day=16)
    assert reservations[7].begins_at.date() == local_date(year=2024, month=1, day=23)
    assert reservations[8].begins_at.date() == local_date(year=2024, month=1, day=30)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_weekdays__invalid_weekday(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, weekdays=[8])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__change_buffer_times(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(
        reservation_series,
        bufferTimeBefore=int(datetime.timedelta(minutes=30).total_seconds()),
        bufferTimeAfter=int(datetime.timedelta(hours=1).total_seconds()),
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Reservation buffer times are set.
    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    for reservation in reservations:
        assert reservation.buffer_time_before == datetime.timedelta(minutes=30)
        assert reservation.buffer_time_after == datetime.timedelta(hours=1)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__empty_series(graphql):
    reservation_series = ReservationSeriesFactory.create()

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == ("Reservation series must have at least one future reservation to reschedule")


@freeze_time(local_datetime(year=2024, month=12, day=1))
def test_reservation_series__reschedule_series__all_reservations_in_the_past(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == ("Reservation series must have at least one future reservation to reschedule")


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Monday
def test_reservation_series__reschedule_series__change_part_of_the_series(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    # Start times stay the same for past reservations.
    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=4, hour=10)
    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=11, hour=10
    )
    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=18, hour=10
    )
    assert reservations[3].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=25, hour=10
    )
    # Start times change for future reservations.
    assert reservations[4].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=1, hour=8)
    assert reservations[5].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=8, hour=8)
    assert reservations[6].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=15, hour=8)
    assert reservations[7].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=22, hour=8)
    assert reservations[8].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=29, hour=8)


@freeze_time(local_datetime(year=2024, month=1, day=1, hour=11))  # Monday
def test_reservation_series__reschedule_series__change_part_of_the_series__during_reservation(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    # Start times stay the same for past reservations.
    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2023, month=12, day=4, hour=10)
    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=11, hour=10
    )
    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=18, hour=10
    )
    assert reservations[3].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(
        year=2023, month=12, day=25, hour=10
    )
    # Start time stays the same for ongoing reservation.
    assert reservations[4].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=1, hour=10)
    # Start times change for future reservations.
    assert reservations[5].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=8, hour=8)
    assert reservations[6].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=15, hour=8)
    assert reservations[7].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=22, hour=8)
    assert reservations[8].begins_at.astimezone(DEFAULT_TIMEZONE) == local_datetime(year=2024, month=1, day=29, hour=8)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
@pytest.mark.parametrize("state", [ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])
def test_reservation_series__reschedule_series__dont_remove_unconfirmed_reservations(graphql, state):
    reservation_series = create_reservation_series()

    reservation: Reservation = reservation_series.reservations.order_by("begins_at").first()
    reservation.state = state
    reservation.save()

    data = get_minimal_reschedule_data(reservation_series, weekdays=[Weekday.TUESDAY.value])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 10
    # The unconfirmed reservation is still there.
    assert reservations[0].state == state
    assert reservations[0].begins_at.date() == local_date(year=2023, month=12, day=4)
    # New reservations start from the new weekday.
    assert reservations[1].state == ReservationStateChoice.CONFIRMED
    assert reservations[1].begins_at.date() == local_date(year=2023, month=12, day=5)


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Friday
def test_reservation_series__reschedule_series__details_from_reservation__use_next(graphql):
    reservation_series = create_reservation_series(reservations__name="foo")

    # Change name for the next reservation.
    # This should be enough to determine that we used this reservation's details.
    reservation: Reservation = reservation_series.reservations.filter(begins_at__date=local_date()).first()
    reservation.name = "bar"
    reservation.save()

    data = get_minimal_reschedule_data(reservation_series, weekdays=[Weekday.TUESDAY.value])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
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
def test_reservation_series__reschedule_series__details_from_reservation__next_is_cancelled(graphql):
    reservation_series = create_reservation_series(reservations__name="foo")

    reservations = reservation_series.reservations.filter(begins_at__date__gte=local_date()).iterator()

    # The next reservation is cancelled, so we shouldn't use its details.
    reservation: Reservation = next(reservations)
    reservation.name = "bar"
    reservation.state = ReservationStateChoice.CANCELLED
    reservation.save()

    # The one after that is still going to occur, so we should use its details.
    reservation: Reservation = next(reservations)
    reservation.name = "baz"
    reservation.save()

    data = get_minimal_reschedule_data(reservation_series, weekdays=[Weekday.TUESDAY.value])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 10
    # Past reservations don't have their details changed.
    assert reservations[0].name == "foo"
    assert reservations[1].name == "foo"
    assert reservations[2].name == "foo"
    assert reservations[3].name == "foo"

    # Cancelled reservations don't have their details changed.
    assert reservations[4].name == "bar"
    assert reservations[4].begins_at.date() == local_date(year=2024, month=1, day=1)

    # New reservation created since weekdays changed.
    assert reservations[5].name == "baz"
    assert reservations[5].begins_at.date() == local_date(year=2024, month=1, day=2)

    # Other future reservations have details from the next reservation confirmed reservation.
    assert reservations[6].name == "baz"
    assert reservations[7].name == "baz"
    assert reservations[8].name == "baz"
    assert reservations[9].name == "baz"


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__end_date_before_begin_date(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, endDate="2023-01-01")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Begin date cannot be after end date."


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__end_date_more_than_two_years_into_future(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, endDate="2025-12-02")  # 2 years + 1 day

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Cannot create reservations for more than 2 years in the future."


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__end_time_before_begin_time__same_day(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(
        reservation_series,
        beginDate="2024-01-01",
        endDate="2024-01-01",
        beginTime="08:00:00",
        endTime="07:00:00",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Begin time cannot be after end time if on the same day."


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__end_time_before_begin_time__different_days(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(
        reservation_series,
        beginDate="2024-01-01",
        endDate="2024-01-02",
        beginTime="08:00:00",
        endTime="07:00:00",
    )

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    # It's enough to check that the mutation was successful, unlike the tests above.
    assert response.has_errors is False


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__invalid_start_interval(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:01")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation start time does not match the allowed interval of 15 minutes."


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__overlapping_reservations(graphql):
    reservation_series = create_reservation_series()

    reservation: Reservation = reservation_series.reservations.order_by("begins_at").first()
    begin_date = reservation.begins_at.date()

    # Add overlapping reservation
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_series.reservation_unit,
        begins_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=8, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        ends_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=8, minute=30),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        state=ReservationStateChoice.CONFIRMED,
    )

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T08:00:00+02:00",
            "end": "2023-12-04T12:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__overlapping_reservations__buffer_before(graphql):
    reservation_series = create_reservation_series(
        reservation_unit__buffer_time_before=datetime.timedelta(minutes=30),
    )

    reservation: Reservation = reservation_series.reservations.order_by("begins_at").first()
    begin_date = reservation.begins_at.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_series.reservation_unit,
        begins_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=7, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        ends_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=8, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        state=ReservationStateChoice.CONFIRMED,
    )

    data = get_minimal_reschedule_data(reservation_series, beginTime=datetime.time(hour=8, minute=0).isoformat())

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T08:00:00+02:00",
            "end": "2023-12-04T12:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__overlapping_reservations__buffer_after(graphql):
    reservation_series = create_reservation_series(
        reservation_unit__buffer_time_after=datetime.timedelta(minutes=30),
    )

    reservation: Reservation = reservation_series.reservations.order_by("begins_at").first()
    begin_date = reservation.begins_at.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_series.reservation_unit,
        begins_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=13, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        ends_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=14, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        state=ReservationStateChoice.CONFIRMED,
    )

    data = get_minimal_reschedule_data(reservation_series, endTime=datetime.time(hour=13, minute=0).isoformat())

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": "2023-12-04T10:00:00+02:00",
            "end": "2023-12-04T13:00:00+02:00",
        },
    ]


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__overlapping_reservations__only_buffers(graphql):
    reservation_series = create_reservation_series(
        reservation_unit__buffer_time_before=datetime.timedelta(minutes=60),
        reservation_unit__buffer_time_after=datetime.timedelta(minutes=60),
    )

    reservation: Reservation = reservation_series.reservations.order_by("begins_at").first()
    begin_date = reservation.begins_at.date()

    # Add overlapping reservation, but only with the buffer time.
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_series.reservation_unit,
        begins_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=14, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        ends_at=datetime.datetime.combine(
            begin_date,
            datetime.time(hour=15, minute=0),
            tzinfo=DEFAULT_TIMEZONE,
        ),
        state=ReservationStateChoice.CONFIRMED,
    )

    data = get_minimal_reschedule_data(reservation_series, endTime="13:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__skip_dates(graphql):
    reservation_series = create_reservation_series()

    assert reservation_series.reservations.count() == 9

    data = get_minimal_reschedule_data(reservation_series, skipDates=["2023-12-04", "2024-01-01"])

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series is missing the two dates that were skipped.
    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 7
    assert reservations[0].begins_at.date() == local_date(year=2023, month=12, day=11)
    assert reservations[1].begins_at.date() == local_date(year=2023, month=12, day=18)
    assert reservations[2].begins_at.date() == local_date(year=2023, month=12, day=25)
    assert reservations[3].begins_at.date() == local_date(year=2024, month=1, day=8)
    assert reservations[4].begins_at.date() == local_date(year=2024, month=1, day=15)
    assert reservations[5].begins_at.date() == local_date(year=2024, month=1, day=22)
    assert reservations[6].begins_at.date() == local_date(year=2024, month=1, day=29)


@freeze_time(local_datetime(year=2023, month=12, day=1))  # Friday
def test_reservation_series__reschedule_series__create_statistics(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_series = create_reservation_series()

    reservation_series.reservations.upsert_statistics()

    # We have 9 reservations, so there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    before = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # After rescheduling, there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    # But those statistics should be for different reservations.
    after = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))
    assert before != after


@freeze_time(local_datetime(year=2024, month=1, day=1))  # Friday
def test_reservation_series__reschedule_series__create_statistics__partial(graphql, settings):
    settings.SAVE_RESERVATION_STATISTICS = True

    reservation_series = create_reservation_series()

    reservation_series.reservations.upsert_statistics()

    # We have 9 reservations, so there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    before = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))

    data = get_minimal_reschedule_data(reservation_series, beginTime="08:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # After rescheduling, there should be 9 reservation statistics.
    assert ReservationStatistic.objects.count() == 9

    # But those statistics should be for different reservations.
    after = list(ReservationStatistic.objects.order_by("reservation").values_list("reservation", flat=True))
    assert before != after


@freeze_time(local_datetime(year=2023, month=12, day=4, hour=10, minute=30))  # Monday
def test_reservation_series__reschedule_series__same_day_ongoing_reservation(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="11:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series entries start at 11:00 instead of 10:00.
    reservation_series.refresh_from_db()
    assert reservation_series.begin_time == local_time(hour=11)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=10)
    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[3].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[4].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[5].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[6].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[7].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[8].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)


@freeze_time(local_datetime(year=2023, month=12, day=4, hour=8))  # Monday
def test_reservation_series__reschedule_series__same_day_future_reservation(graphql):
    reservation_series = create_reservation_series()

    data = get_minimal_reschedule_data(reservation_series, beginTime="11:00:00")

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False

    # Series entries start at 11:00 instead of 10:00.
    reservation_series.refresh_from_db()
    assert reservation_series.begin_time == local_time(hour=11)

    reservations = list(reservation_series.reservations.order_by("begins_at").all())
    assert len(reservations) == 9
    assert reservations[0].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[1].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[2].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[3].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[4].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[5].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[6].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[7].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)
    assert reservations[8].begins_at.astimezone(DEFAULT_TIMEZONE).timetz() == local_time(hour=11)


@freeze_time(local_datetime(year=2023, month=12, day=1))
@patch_method(PindoraService.sync_access_code)
def test_reservation_series__reschedule_series__is_access_code(graphql):
    reservation_series = create_reservation_series(
        reservations__access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
    )

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.called is True


@freeze_time(local_datetime(year=2023, month=12, day=1))
@patch_method(PindoraService.sync_access_code)
def test_reservation_series__reschedule_series__was_access_code(graphql):
    reservation_series = create_reservation_series(
        reservations__access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.UNRESTRICTED,
    )

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.called is True


@freeze_time(local_datetime(year=2023, month=12, day=1))
@patch_method(PindoraService.sync_access_code)
def test_reservation_series__reschedule_series__changed_to_access_code(graphql):
    reservation_series = create_reservation_series(
        reservations__access_type=AccessType.UNRESTRICTED,
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
    )

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.sync_access_code.called is True


@freeze_time(local_datetime(year=2023, month=12, day=1))
@patch_method(PindoraService.sync_access_code, side_effect=PindoraAPIError("Pindora Error"))
def test_reservation_series__reschedule_series__pindora_call_fails(graphql):
    reservation_series = create_reservation_series(
        reservations__access_type=AccessType.ACCESS_CODE,
        reservation_unit__access_types__access_type=AccessType.ACCESS_CODE,
    )

    data = get_minimal_reschedule_data(reservation_series)

    graphql.login_with_superuser()
    response = graphql(RESCHEDULE_SERIES_MUTATION, variables={"input": data})

    # Mutation failed due to unexpected Pindora error.

    assert response.error_message(0) == "Pindora Error"

    assert PindoraService.sync_access_code.called is True
