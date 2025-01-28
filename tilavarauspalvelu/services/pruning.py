from __future__ import annotations

import logging

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import RecurringReservation, Reservation, ReservationStatistic
from tilavarauspalvelu.tasks import delete_pindora_reservation

logger = logging.getLogger(__name__)


__all__ = [
    "prune_inactive_reservations",
    "prune_recurring_reservations",
    "prune_reservation_statistics",
    "prune_reservation_with_inactive_payments",
]


def prune_inactive_reservations() -> None:
    """
    Finds inactive reservations that are older than the given
    number of minutes, and deletes them.
    """
    msg = "Pruning inactive reservations..."
    logger.info(msg)

    qs = Reservation.objects.inactive()

    for reservation in qs.filter(access_code_generated_at__isnull=False):
        try:
            PindoraClient.delete_reservation(reservation=reservation)
        except Exception:  # noqa: BLE001
            delete_pindora_reservation.delay(str(reservation.ext_uuid))

    num_deleted, _ = qs.delete()

    msg = f"Pruned {num_deleted} inactive reservations."
    logger.info(msg)


def prune_reservation_with_inactive_payments() -> None:
    """
    Finds reservations with order that was created given minutes ago and
    are expired or cancelled, and deletes them.
    """
    msg = "Pruning reservations with expired/cancelled orders..."
    logger.info(msg)

    qs = Reservation.objects.with_inactive_payments()

    for reservation in qs.filter(access_code_generated_at__isnull=False):
        try:
            PindoraClient.delete_reservation(reservation=reservation)
        except Exception:  # noqa: BLE001
            delete_pindora_reservation.delay(str(reservation.ext_uuid))

    num_deleted, _ = qs.delete()

    msg = f"Pruned {num_deleted} reservations with inactive orders"
    logger.info(msg)


def prune_reservation_statistics() -> None:
    """Deletes expired ReservationStatistics objects."""
    msg = "Deleting expired reservation statistics..."
    logger.info(msg)

    qs = ReservationStatistic.objects.expired_statistics()
    num_deleted, _ = qs.delete()

    msg = f"Pruned {num_deleted} reservation statistics."
    logger.info(msg)


def prune_recurring_reservations() -> None:
    """Deletes recurring reservations which does not have any reservations."""
    msg = "Deleting old empty recurring reservations..."
    logger.info(msg)

    qs = RecurringReservation.objects.old_empty_series()
    num_deleted, _ = qs.delete()

    msg = f"Pruned {num_deleted} recurring reservations."
    logger.info(msg)
