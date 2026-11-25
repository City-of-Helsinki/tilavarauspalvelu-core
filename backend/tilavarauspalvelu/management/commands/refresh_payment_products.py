from __future__ import annotations

from typing import Any

from django.core.management import BaseCommand
from django.db import models

from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.tasks import refresh_reservation_unit_payment_products_task


class Command(BaseCommand):
    help = (
        "Queues a refresh of the verkkokauppa products and their accounting "
        "for each reservation unit that has a payment merchant."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        reservation_units = ReservationUnit.objects.filter(
            models.Q(payment_merchant__isnull=False) | models.Q(unit__payment_merchant__isnull=False)
        )
        reservation_unit_pks = list(reservation_units.order_by("pk").values_list("pk", flat=True))

        for reservation_unit_pk in reservation_unit_pks:
            refresh_reservation_unit_payment_products_task.delay(reservation_unit_pk)

        self.stdout.write(f"Queued a payment product refresh for {len(reservation_unit_pks)} reservation units.")
