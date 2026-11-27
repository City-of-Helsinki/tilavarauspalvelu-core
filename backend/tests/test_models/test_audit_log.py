from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest
from django.contrib.contenttypes.models import ContentType
from django.db import connection
from django.test.utils import CaptureQueriesContext

from tests.factories import AllocatedTimeSlotFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import audit_log_enabled

if TYPE_CHECKING:
    from tests.factories._base import GenericDjangoModelFactory

pytestmark = [
    pytest.mark.django_db,
]


# ── Queries ──────────────────────────────────────────────────────────────────


@pytest.mark.parametrize("factory", [AllocatedTimeSlotFactory, ReservationFactory, ReservationUnitFactory])
def test_audit_log__create__writes_one_log_entry_and_reads_nothing(
    factory: type[GenericDjangoModelFactory[Any]],
) -> None:
    model = factory._meta.model
    ContentType.objects.get_for_model(model)

    with CaptureQueriesContext(connection) as queries_without_audit_log:
        factory.create()

    with audit_log_enabled(model), CaptureQueriesContext(connection) as queries_with_audit_log:
        factory.create()

    assert len(queries_with_audit_log) - len(queries_without_audit_log) == 1
