from __future__ import annotations

import datetime

import freezegun
import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import Reservation, ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, next_hour

from tests.factories import (
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)

from .helpers import ADJUST_STAFF_MUTATION, get_staff_adjust_data

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL])
def test_reservation__staff_adjust_time__send_email_if_type_normal_or_seasonal(graphql, reservation_type, outbox):
    reservation = ReservationFactory.create_for_time_adjustment(type=reservation_type)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert len(outbox) == 1
    if reservation_type == ReservationTypeChoice.NORMAL:
        assert outbox[0].subject == "Your booking has been updated"
    else:
        assert outbox[0].subject == "The time of the space reservation included in your seasonal booking has changed"


@override_settings(SEND_EMAILS=True)
def test_reservation__staff_adjust_time__dont_send_email_to_staff_type_reservations(graphql, outbox):
    reservation = ReservationFactory.create_for_time_adjustment(type=ReservationTypeChoice.STAFF)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert len(outbox) == 0


def test_reservation__staff_adjust_time__buffer_change_success(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    buffer_time_before = datetime.timedelta(minutes=15)
    buffer_time_after = datetime.timedelta(minutes=30)

    data = get_staff_adjust_data(
        reservation,
        bufferTimeBefore=int(buffer_time_before.total_seconds()),
        bufferTimeAfter=int(buffer_time_after.total_seconds()),
    )

    graphql.login_with_superuser()
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.buffer_time_before == datetime.timedelta(minutes=15)
    assert reservation.buffer_time_after == datetime.timedelta(minutes=30)


def test_reservation__staff_adjust_time__wrong_state(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be rescheduled based on its state"]


def test_reservation__staff_adjust_time__end_before_begin(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    end = next_hour(plus_hours=1)
    begin = end + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot end before it begins"]


def test_reservation__staff_adjust_time__begin_date_in_the_past(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=2)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot begin this much in the past."]


@freezegun.freeze_time(datetime.datetime(2021, 1, 5, hour=12, minute=15, tzinfo=DEFAULT_TIMEZONE))
def test_reservation__staff_adjust_time__begin_date_in_the_past__today(graphql):
    #
    # Allow staff members to move the reservation to earlier time today.
    #
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__reservation_in_the_past(graphql):
    with freezegun.freeze_time(datetime.datetime(2021, 1, 5, hour=12, minute=15, tzinfo=DEFAULT_TIMEZONE)):
        reservation = ReservationFactory.create_for_time_adjustment()

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be changed anymore."]


def test_reservation__staff_adjust_time__reservation_in_the_past__timezone_check(graphql):
    #
    # Regression test to check that the timezone is taken into account when checking reservation's date.
    # against the minimum allowed date.
    #
    # If the reservation begins at the beginning of the day, and it's saved in Helsinki timezone, but is
    # looked up in UTC during the check, then `.date()` would give you the wrong date (the day before).
    # This causes a false negative if the reservation is for the beginning of the current day.
    #
    creation_time = datetime.datetime(2021, 1, 5, hour=0, minute=15, tzinfo=DEFAULT_TIMEZONE)
    with freezegun.freeze_time(creation_time):
        begin = local_datetime()
        end = begin + datetime.timedelta(hours=1)
        reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)

    modify_time = datetime.datetime(2021, 1, 5, hour=10, minute=15, tzinfo=DEFAULT_TIMEZONE)
    with freezegun.freeze_time(modify_time):
        new_begin = next_hour(plus_hours=10)
        new_end = new_begin + datetime.timedelta(hours=1)

        graphql.login_with_superuser()
        data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)
        response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin == new_begin
    assert reservation.end == new_end


@freezegun.freeze_time(datetime.datetime(2021, 1, 5, hour=0, minute=15, tzinfo=DEFAULT_TIMEZONE))
def test_reservation__staff_adjust_time__begin_date_in_the_past__move_to_yesterday_on_first_hour_of_day(graphql):
    #
    # We allow changing the reservation time to the previous day if it's the first hour of the day.
    #
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=1)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__overlaps_with_another_reservation(graphql):
    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_begin - datetime.timedelta(minutes=30)
    blocking_end = new_end - datetime.timedelta(minutes=30)

    reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_units=[reservation.reservation_units.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__overlaps_with_reservation_before_due_to_its_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    blocking_begin = last_hour + datetime.timedelta(hours=1)
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    new_begin = blocking_end
    new_end = new_begin + datetime.timedelta(hours=1)

    begin = new_end
    end = begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_units=[reservation.reservation_units.first()],
        buffer_time_after=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__overlaps_with_reservation_after_due_to_its_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_units=[reservation.reservation_units.first()],
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__overlaps_with_reservation_before_due_to_own_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    blocking_begin = end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    new_begin = blocking_end
    new_end = new_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_units=[reservation.reservation_units.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    new_buffer_before = datetime.timedelta(minutes=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(
        reservation,
        begin=new_begin,
        end=new_end,
        bufferTimeBefore=int(new_buffer_before.total_seconds()),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__overlaps_with_reservation_after_due_to_own_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_time_adjustment(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_units=[reservation.reservation_units.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    new_buffer_after = datetime.timedelta(minutes=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(
        reservation,
        begin=new_begin,
        end=new_end,
        bufferTimeAfter=int(new_buffer_after.total_seconds()),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_adjust_time__reservation_start_time_not_in_interval(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour + datetime.timedelta(hours=1, minutes=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation start time does not match the reservation unit's allowed start interval.",
    ]


@pytest.mark.parametrize("interval", ReservationStartInterval.values)
def test_reservation__staff_adjust_time__reservation_start_interval_over_30_treated_as_30(graphql, interval):
    reservation = ReservationFactory.create_for_time_adjustment(reservation_units__reservation_start_interval=interval)

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour + datetime.timedelta(hours=1, minutes=30)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_adjust_time__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_adjust_time__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    reservation = ReservationFactory.create_for_reservation_unit(
        name="foo",
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
        state=ReservationStateChoice.CONFIRMED.value,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "bufferTimeBefore": int(datetime.timedelta(hours=1).total_seconds()),
        "bufferTimeAfter": int(datetime.timedelta(hours=1).total_seconds()),
    }

    response = graphql(ADJUST_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)
