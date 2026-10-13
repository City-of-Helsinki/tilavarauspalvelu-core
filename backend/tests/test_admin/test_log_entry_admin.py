from __future__ import annotations

import re
from typing import TYPE_CHECKING

import pytest
from auditlog.models import LogEntry
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse

from tilavarauspalvelu.admin.log_entry.filters import LogEntryResourceTypeFilter
from tilavarauspalvelu.admin.log_entry.paginator import LOG_ENTRY_COUNT_LIMIT
from tilavarauspalvelu.models import ReservationUnit, Unit

from tests.factories import ReservationUnitFactory, UnitFactory, UserFactory

if TYPE_CHECKING:
    from django.db import models
    from django.test.client import _MonkeyPatchedWSGIResponse

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


def get_result_count_text(response: _MonkeyPatchedWSGIResponse) -> str:
    content = response.content.decode()
    match = re.search(r'<span class="small quiet">(.*?)</span>', content, flags=re.DOTALL)
    assert match is not None
    return match.group(1)


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


# ── Result count ──


def test_log_entry_admin__result_count__exact_below_limit(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    reservation_unit = ReservationUnitFactory.create()
    create_log_entry(reservation_unit)
    create_log_entry(reservation_unit.unit)

    url = reverse("admin:auditlog_logentry_changelist")
    response = api_client.get(url)

    assert response.status_code == 200

    change_list = response.context["cl"]
    assert change_list.result_count == 2
    assert get_result_count_text(response) == '2 results (<a href="?">Show all</a>)'


def test_log_entry_admin__result_count__limited_above_limit(api_client):
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    unit = UnitFactory.create()
    content_type = ContentType.objects.get_for_model(unit)
    log_entries = (
        LogEntry(
            content_type=content_type,
            object_pk=str(unit.pk),
            object_id=unit.pk,
            object_repr=str(unit),
            action=LogEntry.Action.UPDATE,
        )
        for _ in range(LOG_ENTRY_COUNT_LIMIT + 1)
    )
    LogEntry.objects.bulk_create(log_entries)

    url = reverse("admin:auditlog_logentry_changelist")
    response = api_client.get(url)

    assert response.status_code == 200

    change_list = response.context["cl"]
    assert change_list.result_count == LOG_ENTRY_COUNT_LIMIT
    assert get_result_count_text(response) == f'{LOG_ENTRY_COUNT_LIMIT}+ log entries (<a href="?">Show all</a>)'
