import datetime

import pytest

from common.date_utils import local_datetime
from email_notification.models import EmailType
from reservation_units.enums import ReservationStartInterval
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from tests.factories import EmailTemplateFactory, ReservationFactory, UserFactory

from .helpers import ADJUST_STAFF_MUTATION, get_staff_adjust_data

pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_celery_synchronous"),
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

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    end = next_hour + datetime.timedelta(hours=1)
    begin = end + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "End cannot be before begin"


def test_reservation__staff_adjust_time__begin_date_in_past(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=1)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_adjust_data(reservation, begin=begin, end=end)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation new begin cannot be in the past."


def test_reservation__staff_adjust_time__overlaps_with_another_reservation(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)

    begin = next_hour + datetime.timedelta(hours=1)
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


def test_reservation__staff_adjust_time__unit_reserver_can_adjust_own_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    admin = UserFactory.create_with_unit_permissions(
        unit=reservation.reservation_unit.first().unit,
        perms=["can_create_staff_reservations"],
    )

    graphql.force_login(admin)
    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors


def test_reservation__staff_adjust_time__unit_reserver_cannot_adjust_for_other_user_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    UserFactory.create_with_unit_permissions(
        unit=reservation.reservation_unit.first().unit,
        perms=["can_create_staff_reservations"],
    )

    graphql.login_with_regular_user()

    data = get_staff_adjust_data(reservation)
    response = graphql(ADJUST_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
