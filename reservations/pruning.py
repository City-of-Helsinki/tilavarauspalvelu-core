import datetime
from logging import getLogger

from dateutil.relativedelta import relativedelta

from reservations.models import Reservation, ReservationStatistic

logger = getLogger(__name__)


def prune_reservations(older_than_minutes: int) -> None:
    """
    Finds inactive reservations that are older than the given
    number of minutes, and deletes them.
    """
    logger.info(f"Pruning reservations older than {older_than_minutes} minutes...")
    num_deleted, _ = Reservation.objects.inactive(older_than_minutes).delete()
    logger.info(f"Pruned {num_deleted} reservations.")


def prune_reservation_statistics(older_than_years: int) -> None:
    """Deletes old ReservationStatistics objects"""
    remove_older_than = datetime.datetime.today() - relativedelta(
        years=older_than_years
    )
    num_deleted, _ = ReservationStatistic.objects.filter(
        reservation_created_at__lte=remove_older_than
    ).delete()

    logger.info(f"Pruned {num_deleted} reservation statistics.")
