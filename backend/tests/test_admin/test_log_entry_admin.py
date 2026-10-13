from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse

from tilavarauspalvelu.admin.log_entry.filters import LogEntryResourceTypeFilter
from tilavarauspalvelu.models import ReservationUnit, Unit

from tests.factories import ReservationUnitFactory, UserFactory

if TYPE_CHECKING:
    from django.db import models

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


def create_log_entry(instance: models.Model) -> LogEntry:
    content_type = ContentType.objects.get_for_model(instance)
    return LogEntry.objects.create(
        content_type=content_type,
        object_pk=str(instance.pk),
        object_id=instance.pk,
        object_repr=str(instance),
        action=LogEntry.Action.CREATE,
    )


# ── Resource type filter ──


def test_log_entry_admin__resource_type_filter__lists_content_types_with_log_entries(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()
    create_log_entry(reservation_unit)
    create_log_entry(reservation_unit.unit)

    url = reverse("admin:auditlog_logentry_changelist")
    response = api_client.get(url)

    assert response.status_code == 200

    filter_specs = response.context["cl"].filter_specs
    resource_type_filter = next(spec for spec in filter_specs if isinstance(spec, LogEntryResourceTypeFilter))

    reservation_unit_content_type = ContentType.objects.get_for_model(ReservationUnit)
    unit_content_type = ContentType.objects.get_for_model(Unit)
    choices = resource_type_filter.choices(response.context["cl"])
    shown_choices = [(choice["query_string"], choice["display"]) for choice in choices]
    assert shown_choices == [
        ("?", "All"),
        (f"?resource_type={reservation_unit_content_type.pk}", "reservationunit"),
        (f"?resource_type={unit_content_type.pk}", "unit"),
    ]


def test_log_entry_admin__resource_type_filter__shows_only_selected_content_type(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()
    reservation_unit_log_entry = create_log_entry(reservation_unit)
    create_log_entry(reservation_unit.unit)

    reservation_unit_content_type = ContentType.objects.get_for_model(ReservationUnit)
    url = reverse("admin:auditlog_logentry_changelist")
    response = api_client.get(url, data={"resource_type": reservation_unit_content_type.pk})

    assert response.status_code == 200

    result_list = list(response.context["cl"].result_list)
    assert result_list == [reservation_unit_log_entry]
