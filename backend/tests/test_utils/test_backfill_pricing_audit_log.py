from __future__ import annotations

import contextlib
import io
from decimal import Decimal
from typing import TYPE_CHECKING

import pytest
from auditlog.models import LogEntry
from auditlog.registry import auditlog
from django.core.management import CommandError, call_command

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.management.commands.backfill_pricing_audit_log import CREATED_MODELS
from tilavarauspalvelu.models import Reservation, ReservationUnit

from tests.factories import ReservationFactory, ReservationPriceLineFactory, ReservationUnitFactory
from tests.helpers import exact

if TYPE_CHECKING:
    from collections.abc import Generator

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


@contextlib.contextmanager
def audit_logging(settings) -> Generator[None]:
    """Register the models for audit logging, as in an environment where it is enabled."""
    settings.AUDIT_LOGGING_ENABLED = True
    models = [*CREATED_MODELS, Reservation, ReservationUnit]
    for model in models:
        auditlog.register(model)
    try:
        yield
    finally:
        for model in models:
            auditlog.unregister(model)


def run_command() -> str:
    output = io.StringIO()
    call_command("backfill_pricing_audit_log", stdout=output)
    return output.getvalue()


# ── Created rows ──


def test_backfill_pricing_audit_log__created_rows(settings):
    price_line = ReservationPriceLineFactory.create(amount=Decimal(10), tax_percentage=Decimal("25.5"))

    with audit_logging(settings):
        run_command()

    entries = LogEntry.objects.get_for_object(price_line)
    assert list(entries.values_list("action", flat=True)) == [LogEntry.Action.CREATE]
    changes = entries.get().changes
    assert changes["amount"] == ["None", "10.00"]
    assert changes["tax_percentage"] == ["None", "25.50"]


def test_backfill_pricing_audit_log__skips_rows_that_have_an_entry(settings):
    price_line = ReservationPriceLineFactory.create()

    with audit_logging(settings):
        LogEntry.objects.log_create(price_line, force_log=True, action=LogEntry.Action.CREATE)
        run_command()

    assert LogEntry.objects.get_for_object(price_line).count() == 1


def test_backfill_pricing_audit_log__second_run_writes_nothing(settings):
    ReservationPriceLineFactory.create()
    ReservationUnitFactory.create(payment_type=PaymentType.ONLINE)

    with audit_logging(settings):
        run_command()
        entry_count = LogEntry.objects.count()
        run_command()

    assert LogEntry.objects.count() == entry_count


# ── Reservation totals ──


def test_backfill_pricing_audit_log__reservation_totals(settings):
    reservation = ReservationFactory.create(
        total_price=Decimal("10.00"),
        total_price_without_overrides=Decimal("12.30"),
        total_price_net=Decimal("7.97"),
    )
    free_reservation = ReservationFactory.create(total_price=Decimal(0))

    with audit_logging(settings):
        run_command()

    entries = LogEntry.objects.get_for_object(reservation)
    assert list(entries.values_list("action", "changes")) == [
        (
            LogEntry.Action.UPDATE,
            {
                "total_price": ["0.00", "10.00"],
                "total_price_without_overrides": ["0.00", "12.30"],
                "total_price_net": ["0.00", "7.97"],
            },
        ),
    ]
    assert LogEntry.objects.get_for_object(free_reservation).exists() is False


def test_backfill_pricing_audit_log__reservation_totals_already_logged(settings):
    reservation = ReservationFactory.create(total_price=Decimal("10.00"))

    with audit_logging(settings):
        reservation.total_price = Decimal("11.00")
        reservation.save(update_fields=["total_price"])
        run_command()

    assert LogEntry.objects.get_for_object(reservation).count() == 1


# ── Reservation unit payment type ──


def test_backfill_pricing_audit_log__reservation_unit_payment_type(settings):
    reservation_unit = ReservationUnitFactory.create(payment_type=PaymentType.ONLINE)
    unit_without_payment_type = ReservationUnitFactory.create(payment_type=None)

    with audit_logging(settings):
        run_command()

    entries = LogEntry.objects.get_for_object(reservation_unit)
    assert list(entries.values_list("action", "changes")) == [
        (LogEntry.Action.UPDATE, {"payment_type": ["None", "ONLINE"]}),
    ]
    assert LogEntry.objects.get_for_object(unit_without_payment_type).exists() is False


# ── Errors ──


def test_backfill_pricing_audit_log__audit_logging_not_enabled(settings):
    settings.AUDIT_LOGGING_ENABLED = False

    msg = "Audit logging is not enabled, so there is nothing to backfill."
    with pytest.raises(CommandError, match=exact(msg)):
        run_command()
