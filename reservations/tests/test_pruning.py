from datetime import datetime, timedelta

from assertpy import assert_that
from dateutil.relativedelta import relativedelta
from django.utils.timezone import get_current_timezone
from pytest import mark

from ..models import STATE_CHOICES, Reservation, ReservationStatistic
from ..pruning import prune_reservation_statistics, prune_reservations
from .factories import ReservationFactory


@mark.django_db
def test_prune_reservations_deletes_old_reservations_with_state_created():
    twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(minutes=20)
    ReservationFactory(created_at=twenty_minutes_ago, state=STATE_CHOICES.CREATED)
    prune_reservations(older_than_minutes=20)
    assert_that(Reservation.objects.exists()).is_false()


@mark.django_db
@mark.parametrize(
    "state",
    [
        state[0]
        for state in STATE_CHOICES.STATE_CHOICES
        if state[0] != STATE_CHOICES.CREATED
    ],
)
def test_prune_reservations_does_not_delete_inactive_reservations_with_state(state):
    twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(minutes=20)
    ReservationFactory(created_at=twenty_minutes_ago, state=state)
    prune_reservations(older_than_minutes=20)
    assert_that(Reservation.objects.exists()).is_true()


@mark.django_db
def test_prune_reservations_does_not_delete_recent_reservations():
    under_twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(
        minutes=19
    )
    ReservationFactory(created_at=under_twenty_minutes_ago, state=STATE_CHOICES.CREATED)
    prune_reservations(older_than_minutes=20)
    assert_that(Reservation.objects.exists()).is_true()


@mark.django_db
def test_prune_statistics_deletes_in_the_given_time():
    five_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(years=5)
    four_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(years=4)

    delete = ReservationFactory(created_at=five_years_ago, name="delete my stats")
    keep = ReservationFactory(created_at=four_years_ago, name="don't delete my stats")

    prune_reservation_statistics(5)

    assert_that(
        ReservationStatistic.objects.filter(reservation=delete).count()
    ).is_zero()
    assert_that(
        ReservationStatistic.objects.filter(reservation=keep).count()
    ).is_equal_to(1)
