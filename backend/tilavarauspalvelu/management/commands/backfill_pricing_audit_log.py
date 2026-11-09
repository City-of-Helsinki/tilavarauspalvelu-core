from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING, Any

from auditlog.diff import model_instance_diff
from auditlog.models import LogEntry
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.management import BaseCommand, CommandError
from django.db import models
from django.utils.encoding import smart_str

from tilavarauspalvelu.models import (
    PriceComponent,
    PricingGroup,
    Reservation,
    ReservationPriceLine,
    ReservationUnit,
    ReservationUnitPricingGroup,
    SalesItem,
)

if TYPE_CHECKING:
    from collections.abc import Iterable

BATCH_SIZE = 5_000

# The migrations 0191 and 0193 create rows of these models with bulk writes, which make no audit log.
CREATED_MODELS: list[type[models.Model]] = [
    SalesItem,
    PricingGroup,
    ReservationUnitPricingGroup,
    PriceComponent,
    ReservationPriceLine,
]

RESERVATION_TOTAL_FIELDS = ["total_price", "total_price_without_overrides", "total_price_net"]


class Command(BaseCommand):
    help = (
        "Writes the audit log entries for the rows that the migrations 0191 and 0193 (TILA-4545) made or changed "
        "with bulk writes. A row that already has an entry is skipped, so the command can be run again. "
        "Run it once after the release that has these migrations."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        if not settings.AUDIT_LOGGING_ENABLED:
            msg = "Audit logging is not enabled, so there is nothing to backfill."
            raise CommandError(msg)

        for model in CREATED_MODELS:
            count = _backfill_created_rows(model=model)
            self.stdout.write(f"{model.__name__}: {count} created entries.")

        count = _backfill_reservation_totals()
        self.stdout.write(f"Reservation: {count} updated entries.")

        count = _backfill_reservation_unit_payment_types()
        self.stdout.write(f"ReservationUnit: {count} updated entries.")


# Internals


def _backfill_created_rows(*, model: type[models.Model]) -> int:
    """Write a create entry for each row of the model that has no audit entry at all."""
    content_type = ContentType.objects.get_for_model(model)
    has_entry = models.Exists(
        LogEntry.objects.filter(content_type=content_type, object_id=models.OuterRef("pk")),
    )
    rows = model.objects.exclude(has_entry).order_by("pk").iterator(chunk_size=BATCH_SIZE)

    entries = (
        LogEntry(
            content_type=content_type,
            object_pk=str(row.pk),
            object_id=row.pk,
            object_repr=smart_str(row),
            action=LogEntry.Action.CREATE,
            changes=model_instance_diff(None, row, use_json_for_changes=settings.AUDITLOG_STORE_JSON_CHANGES),
        )
        for row in rows
    )
    return _bulk_create_in_batches(entries=entries)


def _backfill_reservation_totals() -> int:
    """Write an update entry for each reservation whose totals the migration set, if no entry has them yet."""
    content_type = ContentType.objects.get_for_model(Reservation)
    has_entry = models.Exists(
        LogEntry.objects.filter(
            content_type=content_type,
            object_id=models.OuterRef("pk"),
            changes__has_key="total_price",
        ),
    )
    has_totals = models.Q(total_price__gt=0) | models.Q(total_price_without_overrides__gt=0)
    rows = (
        Reservation.objects
        .filter(has_totals)
        .exclude(has_entry)
        .only("pk", "name", "type", *RESERVATION_TOTAL_FIELDS)
        .order_by("pk")
        .iterator(chunk_size=BATCH_SIZE)
    )

    # The totals were 0 before the migration set them.
    old_value = smart_str(Decimal("0.00"))
    entries = (
        LogEntry(
            content_type=content_type,
            object_pk=str(row.pk),
            object_id=row.pk,
            object_repr=smart_str(row),
            action=LogEntry.Action.UPDATE,
            changes={
                "total_price": [old_value, smart_str(row.total_price)],
                "total_price_without_overrides": [old_value, smart_str(row.total_price_without_overrides)],
                "total_price_net": [old_value, smart_str(row.total_price_net)],
            },
        )
        for row in rows
    )
    return _bulk_create_in_batches(entries=entries)


def _backfill_reservation_unit_payment_types() -> int:
    """Write an update entry for each reservation unit whose payment type the migration set, if no entry has it."""
    content_type = ContentType.objects.get_for_model(ReservationUnit)
    has_entry = models.Exists(
        LogEntry.objects.filter(
            content_type=content_type,
            object_id=models.OuterRef("pk"),
            changes__has_key="payment_type",
        ),
    )
    rows = (
        ReservationUnit.objects
        .filter(payment_type__isnull=False)
        .exclude(has_entry)
        .select_related("unit")
        .order_by("pk")
        .iterator(chunk_size=BATCH_SIZE)
    )

    entries = (
        LogEntry(
            content_type=content_type,
            object_pk=str(row.pk),
            object_id=row.pk,
            object_repr=smart_str(row),
            action=LogEntry.Action.UPDATE,
            changes={"payment_type": [smart_str(None), smart_str(row.payment_type)]},
        )
        for row in rows
    )
    return _bulk_create_in_batches(entries=entries)


def _bulk_create_in_batches(*, entries: Iterable[LogEntry]) -> int:
    count = 0
    batch: list[LogEntry] = []
    for entry in entries:
        batch.append(entry)
        if len(batch) >= BATCH_SIZE:
            LogEntry.objects.bulk_create(batch)
            count += len(batch)
            batch = []

    LogEntry.objects.bulk_create(batch)
    return count + len(batch)
