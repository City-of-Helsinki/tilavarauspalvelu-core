import datetime
from datetime import timedelta
from decimal import Decimal

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import local_date, local_datetime
from email_notification.models import EmailType
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnitHierarchy
from reservations.enums import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import (
    ApplicationRoundFactory,
    EmailTemplateFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
    UserFactory,
)

from .helpers import ADJUST_MUTATION, get_adjust_data

pytestmark = [
    pytest.mark.django_db,
]


DEFAULT_TIMEZONE = get_default_timezone()


def test_reservation__adjust_time__success(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    EmailTemplateFactory.create(type=EmailType.RESERVATION_MODIFIED, subject="modified")

    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end

    assert len(outbox) == 1
    assert outbox[0].subject == "modified"


def test_reservation__adjust_time__wrong_state(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(state=ReservationStateChoice.CANCELLED)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Only reservations in 'CONFIRMED' state can be rescheduled."


def test_reservation__adjust_time__new_reservation_begin_in_past(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(last_hour - datetime.timedelta(hours=1)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation new begin cannot be in the past"


def test_reservation__adjust_time__reservation__adjust_time__reservation_begin_in_past(graphql):
    now = local_datetime()
    reservation = ReservationFactory.create_for_time_adjustment(
        begin=now - datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=1),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation time cannot be changed when current begin time is in past."


def test_reservation__adjust_time__reservation_unit_missing_cancellation_rule(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(reservation_unit__cancellation_rule=None)

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation time cannot be changed thus no cancellation rule."


def test_reservation__adjust_time__cancellation_rule_time_limit_exceed(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=24),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation time cannot be changed because the cancellation period has expired."


def test_reservation__adjust_time__cancellation_rule_has_needs_handling(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__cancellation_rule__needs_handling=True,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, data)

    assert response.error_message() == "Reservation time change needs manual handling."


def test_reservation__adjust_time__reservation_is_already_handled(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(handled_at=local_datetime())

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation has gone through handling and cannot be changed anymore."


def test_reservation__adjust_time__reservation_has_price_to_be_paid(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(price_net=Decimal("1"))

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation time cannot be changed due to its price"


def test_reservation__adjust_time__change_would_make_unit_reservation_unit_paid(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    ReservationUnitPricingFactory.create(
        begins=local_date(),
        reservation_unit=reservation.reservation_unit.first(),
    )

    data = get_adjust_data(reservation)

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation begin time change causes price change that not allowed."


def test_reservation__adjust_time__reservation_unit_not_reservable_in_new_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__reservation_begins=local_datetime() + datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable at current time."


def test_reservation__adjust_time__new_time_overlaps_another_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    overlapping = ReservationFactory.create(
        reservation_unit=[reservation.reservation_unit.first()],
        begin=reservation.begin + datetime.timedelta(hours=1),
        end=reservation.end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=overlapping.begin.isoformat(),
        end=overlapping.end.isoformat(),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Overlapping reservations are not allowed."


def test_reservation__adjust_time__new_time_duration_under_min_duration(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__min_reservation_duration=datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration less than one or more reservation unit's minimum duration."


def test_reservation__adjust_time__new_time_duration_over_max_duration(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__max_reservation_duration=datetime.timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration exceeds one or more reservation unit's maximum duration."


def test_reservation__adjust_time__overlaps_with_buffer_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    ReservationFactory.create(
        reservation_unit=[reservation.reservation_unit.first()],
        begin=reservation.begin + datetime.timedelta(hours=3),
        end=reservation.end + datetime.timedelta(hours=3),
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)

    ReservationUnitHierarchy.refresh()

    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."


def test_reservation__adjust_time__max_days_before_exceeded(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__reservations_max_days_before=1,
    )

    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=2)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=2)).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time is earlier than 1 days before."


def test_reservation__adjust_time__min_days_before_subceeded(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__reservations_min_days_before=7,
    )

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=5)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=5)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time is later than 7 days before."


def test_reservation__adjust_time__reservation_unit_not_open_in_new_time(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    graphql.login_with_superuser()
    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(days=3)).isoformat(),
        end=(reservation.end + datetime.timedelta(days=3)).isoformat(),
    )
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not open within desired reservation time."


def test_reservation__adjust_time__reservation_unit_in_open_application_round(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    ApplicationRoundFactory.create_in_status_open(
        reservation_units=[reservation.reservation_unit.first()],
        reservation_period_begin=reservation.begin.date(),
        reservation_period_end=reservation.end.date() + datetime.timedelta(days=1),  # +1d to reduce flakiness at night
    )

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "One or more reservation units are in open application round."


def test_reservation__adjust_time__reservation_start_time_not_within_the_interval(graphql):
    reservation = ReservationFactory.create_for_time_adjustment(
        reservation_unit__reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
    )

    data = get_adjust_data(
        reservation,
        begin=(reservation.begin + datetime.timedelta(hours=1, minutes=10)).isoformat(),
    )

    graphql.login_with_superuser()
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration is not a multiple of the allowed interval of 15 minutes."


def test_reservation__adjust_time__reservee_can_adjust(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    graphql.force_login(reservation.user)

    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end


def test_reservation__adjust_time__adjust_not_allowed_for_another_user(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()

    graphql.login_with_regular_user()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."


def test_reservation__adjust_time__unit_admin_can_adjust_user_reservation(graphql):
    reservation = ReservationFactory.create_for_time_adjustment()
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    unit = reservation.reservation_unit.first().unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end


def test_reservation__adjust_time__needs_handling_after_time_change(graphql, outbox, settings):
    settings.SEND_RESERVATION_NOTIFICATION_EMAILS = True

    EmailTemplateFactory.create(
        type=EmailType.RESERVATION_MODIFIED,
        content="",
        subject="modified",
    )

    EmailTemplateFactory.create(
        type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
        content="",
        subject="staff",
    )

    reservation = ReservationFactory.create_for_time_adjustment(reservation_unit__require_reservation_handling=True)
    reservation_begin = reservation.begin
    reservation_end = reservation.end

    # Staff user will receive email about the reservation requiring handling
    unit = reservation.reservation_unit.first().unit
    UserFactory.create_with_unit_role(units=[unit])

    graphql.login_with_superuser()
    data = get_adjust_data(reservation)
    response = graphql(ADJUST_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING
    assert reservation.begin != reservation_begin
    assert reservation.end != reservation_end

    assert len(outbox) == 2
    assert outbox[0].subject == "modified"
    assert outbox[1].subject == "staff"


@freezegun.freeze_time("2021-01-01")
def test_reservation__update__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=timedelta(hours=0),
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
        handled_at=None,
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__update__update_reservation_buffer_on_adjust(graphql):
    reservation_unit = ReservationUnitFactory.create(
        buffer_time_before=timedelta(hours=1),
        buffer_time_after=timedelta(hours=1),
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        spaces=[SpaceFactory.create()],
        cancellation_rule__can_be_cancelled_time_before=timedelta(hours=0),
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
        handled_at=None,
    )

    # Changing the reservation unit buffers. These should be applied to the reservation when it is adjusted.
    reservation_unit.buffer_time_before = timedelta(hours=2)
    reservation_unit.buffer_time_after = timedelta(hours=2)
    reservation_unit.save()

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "pk": reservation.pk,
        "begin": datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
    }

    response = graphql(ADJUST_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, 13, tzinfo=DEFAULT_TIMEZONE)
    # New reservation unit buffers are applied automatically on adjust.
    assert reservation.buffer_time_before == timedelta(hours=2)
    assert reservation.buffer_time_after == timedelta(hours=2)
