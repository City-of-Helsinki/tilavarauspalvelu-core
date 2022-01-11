from logging import getLogger

from reservations.models import Reservation

logger = getLogger(__name__)


def prune_reservations(older_than_minutes: int) -> None:
    """
    Finds inactive reservations that are older than the given
    number of minutes, and deletes them.
    """
    logger.info(f"Pruning reservations older than {older_than_minutes} minutes...")
    num_deleted, _ = Reservation.objects.inactive(older_than_minutes).delete()
    logger.info(f"Pruned {num_deleted} reservations.")
