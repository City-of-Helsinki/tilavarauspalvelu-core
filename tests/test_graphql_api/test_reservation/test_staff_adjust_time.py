import datetime

import freezegun
import pytest

from tests.factories import EmailTemplateFactory, ReservationFactory
from tilavarauspalvelu.enums import EmailType, ReservationStartInterval, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.models import ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime, next_hour

from .helpers import ADJUST_STAFF_MUTATION, get_staff_adjust_data

pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__staff_adjust_time__send_email_if_type_normal(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    reservation = ReservationFactory.create_for_time_adjustment()
    template = EmailTemplateFactory.create(type=EmailType.RESERVATION_MODIFIED, subject="modified")

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert len(outbox) == 1
    assert outbox[0].subject == template.subject


def test_reservation__staff_adjust_time__dont_send_email_to_staff_type_reservations(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    reservation = ReservationFactory.create_for_time_adjustment(type=ReservationTypeChoice.STAFF)
    EmailTemplateFactory.create(type=EmailType.RESERVATION_MODIFIED, subject="modified")

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert len(outbox) == 0


def test_reservation__staff_adjust_time__buffer_change_success(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, bufferTimeBefore="00:15:00", bufferTimeAfter="00:30:00")
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

    assert response.error_message() == "Reservation must be in confirmed state."


def test_reservation__staff_adjust_time__end_before_begin(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    end = next_hour(plus_hours=1)
    begin = end + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "End cannot be before begin"


def test_reservation__staff_adjust_time__begin_date_in_the_past(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=1)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation new begin date cannot be in the past."


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

    assert response.error_message() == "Reservation time cannot be changed anymore."


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
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Overlapping reservations are not allowed."

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
        reservation_unit=[reservation.reservation_unit.first()],
        buffer_time_after=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."

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
        reservation_unit=[reservation.reservation_unit.first()],
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."

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
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end, bufferTimeBefore="00:01:00")

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."

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
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=new_begin, end=new_end, bufferTimeAfter="00:01:00")

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."

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

    assert response.error_message() == "Reservation start time does not match the allowed interval of 15 minutes."


@pytest.mark.parametrize("interval", ReservationStartInterval.values)
def test_reservation__staff_adjust_time__reservation_start_interval_over_30_treated_as_30(graphql, interval):
    reservation = ReservationFactory.create_for_time_adjustment(reservation_unit__reservation_start_interval=interval)

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
