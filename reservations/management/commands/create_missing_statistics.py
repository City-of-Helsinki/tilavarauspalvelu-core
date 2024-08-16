from typing import Any

from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.management.base import BaseCommand

from common.date_utils import local_datetime
from reservations.models import Reservation
from reservations.tasks import create_or_update_reservation_statistics


class Command(BaseCommand):
    help = "Creates any missing reservation statistics for reservations that don't have them"

    def handle(self, *args: Any, **options: Any) -> None:
        create_missing_statistics()


def create_missing_statistics() -> None:
    pruned_cutoff = local_datetime() - relativedelta(years=settings.REMOVE_RESERVATION_STATS_OLDER_THAN_YEARS)

    pks: list[int] = list(
        Reservation.objects.filter(
            reservationstatistic__isnull=True,
            # Don't recreate statistics for old reservations
            created_at__gt=pruned_cutoff,
        ).values_list("pk", flat=True)
    )

    create_or_update_reservation_statistics(pks)
