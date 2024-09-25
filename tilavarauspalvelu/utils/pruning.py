import datetime
import logging

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.utils.timezone import get_default_timezone

from tilavarauspalvelu.models import RecurringReservation, Reservation, ReservationStatistic

logger = logging.getLogger(__name__)


def prune_inactive_reservations() -> None:
    """
    Finds inactive reservations that are older than the given
    number of minutes, and deletes them.
    """
    older_than_minutes = settings.PRUNE_RESERVATIONS_OLDER_THAN_MINUTES
    logger.info(f"Pruning inactive reservations older than {older_than_minutes} minutes...")
    num_deleted, _ = Reservation.objects.inactive(older_than_minutes).delete()
    logger.info(f"Pruned {num_deleted} inactive reservations.")


def prune_reservation_with_inactive_payments() -> None:
    """
    Finds reservations with order that was created given minutes ago and
    are expired or cancelled, and deletes them
    """
    older_than_minutes = settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES
    logger.info(
        f"Pruning reservations with expired/cancelled orders that are older than {older_than_minutes} minutes..."
    )
    num_deleted, _ = Reservation.objects.with_inactive_payments().delete()
    logger.info(f"Pruned {num_deleted} reservations with inactive orders")


def prune_reservation_statistics() -> None:
    """Deletes old ReservationStatistics objects"""
    older_than_years = settings.REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS
    remove_older_than = datetime.datetime.today() - relativedelta(years=older_than_years)
    num_deleted, _ = ReservationStatistic.objects.filter(reservation_created_at__lte=remove_older_than).delete()

    logger.info(f"Pruned {num_deleted} reservation statistics.")


def prune_recurring_reservations() -> None:
    """Deletes recurring reservations which does not have any reservations."""
    older_than_days = settings.REMOVE_RECURRING_RESERVATIONS_OLDER_THAN_DAYS
    created_before = datetime.datetime.now(tz=get_default_timezone()) - relativedelta(days=older_than_days)
    num_deleted, _ = RecurringReservation.objects.filter(
        created__lte=created_before, reservations__isnull=True
    ).delete()

    logger.info(f"Pruned {num_deleted} recurring reservations.")
