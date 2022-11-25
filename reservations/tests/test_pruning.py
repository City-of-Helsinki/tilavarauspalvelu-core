from datetime import datetime, timedelta

from assertpy import assert_that
from dateutil.relativedelta import relativedelta
from django.test import TestCase
from django.utils.timezone import get_current_timezone

from ..models import STATE_CHOICES, Reservation, ReservationStatistic
from ..pruning import prune_inactive_reservations, prune_reservation_statistics
from .factories import ReservationFactory


class PruneInactiveReservationsTestCase(TestCase):
    def test_prune_reservations_deletes_old_reservations_with_state_created(self):
        twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(
            minutes=20
        )
        ReservationFactory(created_at=twenty_minutes_ago, state=STATE_CHOICES.CREATED)
        prune_inactive_reservations(older_than_minutes=20)
        assert_that(Reservation.objects.exists()).is_false()

    def test_prune_reservations_does_not_delete_inactive_reservations_with_state(self):
        ignored_states = tuple(
            [
                item
                for item in STATE_CHOICES.STATE_CHOICES
                if item[0] != STATE_CHOICES.CREATED
            ]
        )
        for state, _ in ignored_states:
            twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(
                minutes=20
            )
            ReservationFactory(created_at=twenty_minutes_ago, state=state)
            prune_inactive_reservations(older_than_minutes=20)
            assert_that(Reservation.objects.exists()).is_true()

    def test_prune_reservations_does_not_delete_recent_reservations(self):
        under_twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(
            minutes=19
        )
        ReservationFactory(
            created_at=under_twenty_minutes_ago, state=STATE_CHOICES.CREATED
        )
        prune_inactive_reservations(older_than_minutes=20)
        assert_that(Reservation.objects.exists()).is_true()


class PruneReservationStatisticsTestCase(TestCase):
    def test_prune_statistics_deletes_in_the_given_time(self):
        five_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(
            years=5
        )
        four_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(
            years=4
        )

        delete = ReservationFactory(created_at=five_years_ago, name="delete my stats")
        keep = ReservationFactory(
            created_at=four_years_ago, name="don't delete my stats"
        )

        prune_reservation_statistics(5)

        assert_that(
            ReservationStatistic.objects.filter(reservation=delete).count()
        ).is_zero()
        assert_that(
            ReservationStatistic.objects.filter(reservation=keep).count()
        ).is_equal_to(1)
