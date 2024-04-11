from datetime import datetime, timedelta
from uuid import uuid4

from dateutil.relativedelta import relativedelta
from django.test import TestCase, override_settings
from django.utils.timezone import get_current_timezone, get_default_timezone
from freezegun import freeze_time

from merchants.models import OrderStatus
from reservations.choices import ReservationStateChoice
from reservations.models import (
    RecurringReservation,
    Reservation,
    ReservationStatistic,
)
from reservations.pruning import (
    prune_inactive_reservations,
    prune_recurring_reservations,
    prune_reservation_statistics,
    prune_reservation_with_inactive_payments,
)
from tests.factories import PaymentOrderFactory, RecurringReservationFactory, ReservationFactory


class PruneInactiveReservationsTestCase(TestCase):
    def test_prune_reservations_deletes_old_reservations_with_state_created(self):
        twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(minutes=20)
        ReservationFactory(created_at=twenty_minutes_ago, state=ReservationStateChoice.CREATED)
        prune_inactive_reservations(older_than_minutes=20)
        assert Reservation.objects.exists() is False

    def test_prune_reservations_does_not_delete_inactive_reservations_with_state(self):
        ignored_states = tuple(
            [item for item in ReservationStateChoice.choices if item[0] != ReservationStateChoice.CREATED]
        )
        for state, _ in ignored_states:
            twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(minutes=20)
            ReservationFactory(created_at=twenty_minutes_ago, state=state)
            prune_inactive_reservations(older_than_minutes=20)
            assert Reservation.objects.exists() is True

    def test_prune_reservations_does_not_delete_recent_reservations(self):
        under_twenty_minutes_ago = datetime.now(tz=get_current_timezone()) - timedelta(minutes=19)
        ReservationFactory(created_at=under_twenty_minutes_ago, state=ReservationStateChoice.CREATED)
        prune_inactive_reservations(older_than_minutes=20)
        assert Reservation.objects.exists() is True


class PruneReservationStatisticsTestCase(TestCase):
    def test_prune_statistics_deletes_in_the_given_time(self):
        five_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(years=5)
        four_years_ago = datetime.now(tz=get_current_timezone()) - relativedelta(years=4)

        delete = ReservationFactory(created_at=five_years_ago, name="delete my stats")
        keep = ReservationFactory(created_at=four_years_ago, name="don't delete my stats")

        prune_reservation_statistics(5)

        assert ReservationStatistic.objects.filter(reservation=delete).exists() is False
        assert ReservationStatistic.objects.filter(reservation=keep).count() == 1


@override_settings(VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=5)
class PruneReservationsWithInactivePaymentsTestCase(TestCase):
    def test_prune_deletes_reservations_with_inactive_payments(self):
        now = datetime.now(tz=get_current_timezone())
        five_minutes_ago = now - timedelta(minutes=5)

        with freeze_time(five_minutes_ago):
            reservation_with_cancelled = ReservationFactory(
                name="delete_me", state=ReservationStateChoice.WAITING_FOR_PAYMENT
            )
            PaymentOrderFactory(
                reservation=reservation_with_cancelled,
                remote_id=uuid4(),
                status=OrderStatus.CANCELLED,
            )

            reservation_with_expired = ReservationFactory(
                name="delete_me_too", state=ReservationStateChoice.WAITING_FOR_PAYMENT
            )
            PaymentOrderFactory(
                reservation=reservation_with_expired,
                remote_id=uuid4(),
                status=OrderStatus.CANCELLED,
            )

        with freeze_time(now):
            prune_reservation_with_inactive_payments()
            assert Reservation.objects.exists() is False

    def test_prune_does_not_delete_reservations_with_fresh_payments(self):
        now = datetime.now(tz=get_current_timezone())
        five_minutes_ago = now - timedelta(minutes=5)
        less_than_five_minutes_ago = now - timedelta(minutes=3)

        with freeze_time(less_than_five_minutes_ago):
            reservation_with_fresh_1 = ReservationFactory(
                name="do not delete me", state=ReservationStateChoice.WAITING_FOR_PAYMENT
            )
            PaymentOrderFactory(
                reservation=reservation_with_fresh_1,
                remote_id=uuid4(),
                status=OrderStatus.CANCELLED,
            )

            reservation_with_fresh_2 = ReservationFactory(
                name="do not delete me either", state=ReservationStateChoice.WAITING_FOR_PAYMENT
            )
            PaymentOrderFactory(
                reservation=reservation_with_fresh_2,
                remote_id=uuid4(),
                status=OrderStatus.CANCELLED,
            )

        with freeze_time(five_minutes_ago):
            reservation_with_old = ReservationFactory(
                name="delete me!", state=ReservationStateChoice.WAITING_FOR_PAYMENT
            )
            PaymentOrderFactory(
                reservation=reservation_with_old,
                remote_id=uuid4(),
                created_at=five_minutes_ago,
                status=OrderStatus.CANCELLED,
            )

        with freeze_time(now):
            prune_reservation_with_inactive_payments()
            assert Reservation.objects.count() == 2

    def test_prune_does_not_delete_reservations_in_other_states(self):
        now = datetime.now(tz=get_current_timezone())
        five_minutes_ago = now - timedelta(minutes=5)

        ignored_states = tuple(
            [item for item in ReservationStateChoice.choices if item[0] != ReservationStateChoice.WAITING_FOR_PAYMENT]
        )

        for state, _ in ignored_states:
            with freeze_time(five_minutes_ago):
                reservation_with_ignored_state = ReservationFactory(name="do not delete me", state=state)
                PaymentOrderFactory(
                    reservation=reservation_with_ignored_state,
                    remote_id=uuid4(),
                    status=OrderStatus.CANCELLED,
                )

            with freeze_time(now):
                prune_reservation_with_inactive_payments()
                assert Reservation.objects.count() == 1
                Reservation.objects.all().delete()

    def test_prune_does_not_delete_reservations_without_remote_id(self):
        now = datetime.now(tz=get_current_timezone())
        five_minutes_ago = now - timedelta(minutes=5)

        with freeze_time(five_minutes_ago):
            reservation = ReservationFactory(name="do not delete_me", state=ReservationStateChoice.WAITING_FOR_PAYMENT)
            PaymentOrderFactory(reservation=reservation, status=OrderStatus.CANCELLED, remote_id=None)

        with freeze_time(now):
            prune_reservation_with_inactive_payments()
            assert Reservation.objects.exists() is True

    def test_prune_does_not_delete_reservations_without_order(self):
        ReservationFactory(name="do not delete_me", state=ReservationStateChoice.WAITING_FOR_PAYMENT)

        prune_reservation_with_inactive_payments()
        assert Reservation.objects.exists() is True


class PruneRecurringReservationsTestCase(TestCase):
    def test_prune_recurring_reservations_deletes_older_without_reservations(self):
        day_ago = datetime.now(tz=get_default_timezone()) - timedelta(days=1)
        with freeze_time(day_ago):
            RecurringReservationFactory()

        prune_recurring_reservations(1)
        assert Reservation.objects.exists() is False

    def test_prune_recurring_reservations_does_not_delete_ones_with_reservations(self):
        day_ago = datetime.now(tz=get_default_timezone()) - timedelta(days=1)

        with freeze_time(day_ago):
            rec_1 = RecurringReservationFactory()
            RecurringReservationFactory()

        ReservationFactory(recurring_reservation=rec_1)

        prune_recurring_reservations(1)

        rec_1.refresh_from_db()
        assert rec_1.id is not None

        assert RecurringReservation.objects.count() == 1

    def test_prune_recurring_reservations_respects_remove_older_than_days(self):
        not_a_day_ago = datetime.now(tz=get_default_timezone()) - timedelta(hours=23, minutes=59)
        with freeze_time(not_a_day_ago):
            RecurringReservationFactory(created=not_a_day_ago)
        prune_recurring_reservations(1)

        assert RecurringReservation.objects.exists() is True
