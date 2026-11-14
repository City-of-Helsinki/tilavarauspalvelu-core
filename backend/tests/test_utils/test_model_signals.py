from __future__ import annotations

from unittest.mock import ANY

import pytest
from auditlog.models import LogEntry
from auditlog.registry import auditlog
from django.db import connection, models
from freezegun import freeze_time

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import UnitRole
from utils.date_utils import local_datetime
from utils.model_signals import (
    UpdateWithSignalsFieldError,
    bulk_create_with_signals,
    bulk_update_with_signals,
    update_with_signals,
)

from tests.factories import UnitFactory, UnitRoleFactory, UserFactory
from tests.helpers import exact

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──────────────────────────────────────────────────────────────────


@pytest.fixture
def unit_role_audit_log():
    auditlog.register(UnitRole)
    yield
    auditlog.unregister(UnitRole)


def get_log_entries(unit_role: UnitRole) -> list[LogEntry]:
    log_entries = LogEntry.objects.get_for_object(unit_role).order_by("pk")
    return list(log_entries)


# ── bulk_create_with_signals ─────────────────────────────────────────────────


@pytest.mark.usefixtures("unit_role_audit_log")
def test_bulk_create_with_signals__logs_create():
    user = UserFactory.create()
    unit_roles = [
        UnitRole(user=user, role=UserRoleChoice.ADMIN),
        UnitRole(user=user, role=UserRoleChoice.VIEWER),
    ]

    created_unit_roles = bulk_create_with_signals(unit_roles)

    assert UnitRole.objects.filter(user=user).count() == 2

    for unit_role in created_unit_roles:
        log_entries = get_log_entries(unit_role)
        assert [log_entry.action for log_entry in log_entries] == [LogEntry.Action.CREATE]


def test_bulk_create_with_signals__no_instances():
    assert bulk_create_with_signals([]) == []


# ── bulk_update_with_signals ─────────────────────────────────────────────────


@pytest.mark.usefixtures("unit_role_audit_log")
def test_bulk_update_with_signals__writes_and_logs_given_fields():
    unit_role = UnitRoleFactory.create(role=UserRoleChoice.ADMIN, is_role_active=True)
    LogEntry.objects.all().delete()

    unit_role.is_role_active = False
    unit_role.role = UserRoleChoice.VIEWER

    bulk_update_with_signals([unit_role], fields=["is_role_active"])

    log_entries = get_log_entries(unit_role)
    assert [log_entry.action for log_entry in log_entries] == [LogEntry.Action.UPDATE]
    assert log_entries[0].changes == {"is_role_active": ["True", "False"], "updated_at": [ANY, ANY]}

    unit_role.refresh_from_db()
    assert unit_role.is_role_active is False
    assert unit_role.role == UserRoleChoice.ADMIN


def test_bulk_update_with_signals__sets_auto_now_fields():
    with freeze_time(local_datetime(2024, 1, 1, 12)):
        unit_role = UnitRoleFactory.create(is_role_active=True)

    unit_role.is_role_active = False

    with freeze_time(local_datetime(2024, 1, 2, 12)):
        bulk_update_with_signals([unit_role], fields=["is_role_active"])

    unit_role.refresh_from_db()
    assert unit_role.updated_at == local_datetime(2024, 1, 2, 12)


# ── update_with_signals ──────────────────────────────────────────────────────


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__plain_value():
    unit_role = UnitRoleFactory.create(is_role_active=True)
    other_unit_role = UnitRoleFactory.create(is_role_active=True)
    LogEntry.objects.all().delete()

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    count = update_with_signals(queryset, is_role_active=False)

    assert count == 1

    unit_role.refresh_from_db()
    assert unit_role.is_role_active is False

    log_entries = get_log_entries(unit_role)
    assert [log_entry.action for log_entry in log_entries] == [LogEntry.Action.UPDATE]
    assert log_entries[0].changes == {"is_role_active": ["True", "False"], "updated_at": [ANY, ANY]}

    other_unit_role.refresh_from_db()
    assert other_unit_role.is_role_active is True
    assert get_log_entries(other_unit_role) == []


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__model_instance_value():
    unit_role = UnitRoleFactory.create(assigner=None)
    assigner = UserFactory.create()
    LogEntry.objects.all().delete()

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    update_with_signals(queryset, assigner=assigner)

    unit_role.refresh_from_db()
    assert unit_role.assigner_id == assigner.pk

    log_entries = get_log_entries(unit_role)
    assert log_entries[0].changes == {"assigner": ["None", str(assigner.pk)], "updated_at": [ANY, ANY]}


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__primary_key_value_for_foreign_key():
    unit_role = UnitRoleFactory.create(assigner=None)
    assigner = UserFactory.create()
    LogEntry.objects.all().delete()

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    update_with_signals(queryset, assigner=assigner.pk)

    unit_role.refresh_from_db()
    assert unit_role.assigner_id == assigner.pk

    log_entries = get_log_entries(unit_role)
    assert log_entries[0].changes == {"assigner": ["None", str(assigner.pk)], "updated_at": [ANY, ANY]}


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__expression_value():
    admin_role = UnitRoleFactory.create(role=UserRoleChoice.ADMIN, is_role_active=True)
    viewer_role = UnitRoleFactory.create(role=UserRoleChoice.VIEWER, is_role_active=True)
    LogEntry.objects.all().delete()

    is_role_active = models.Case(
        models.When(role=UserRoleChoice.ADMIN, then=models.Value(True)),  # noqa: FBT003
        default=models.Value(False),  # noqa: FBT003
        output_field=models.BooleanField(),
    )
    queryset = UnitRole.objects.all()
    count = update_with_signals(queryset, is_role_active=is_role_active)

    assert count == 2

    admin_role.refresh_from_db()
    assert admin_role.is_role_active is True

    viewer_role.refresh_from_db()
    assert viewer_role.is_role_active is False

    admin_log_entries = get_log_entries(admin_role)
    assert admin_log_entries[0].changes == {"updated_at": [ANY, ANY]}

    viewer_log_entries = get_log_entries(viewer_role)
    assert viewer_log_entries[0].changes == {"is_role_active": ["True", "False"], "updated_at": [ANY, ANY]}


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__foreign_key_expression_value():
    unit_role = UnitRoleFactory.create(assigner=None)
    LogEntry.objects.all().delete()

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    update_with_signals(queryset, assigner=models.F("user"))

    unit_role.refresh_from_db()
    assert unit_role.assigner_id == unit_role.user_id

    log_entries = get_log_entries(unit_role)
    assert log_entries[0].changes == {"assigner": ["None", str(unit_role.user_id)], "updated_at": [ANY, ANY]}


@pytest.mark.usefixtures("unit_role_audit_log")
def test_update_with_signals__no_values():
    unit_role = UnitRoleFactory.create()
    LogEntry.objects.all().delete()

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    count = update_with_signals(queryset)

    assert count == 0
    assert get_log_entries(unit_role) == []


def test_update_with_signals__sets_auto_now_fields():
    with freeze_time(local_datetime(2024, 1, 1, 12)):
        unit_role = UnitRoleFactory.create(is_role_active=True)

    queryset = UnitRole.objects.filter(pk=unit_role.pk)

    with freeze_time(local_datetime(2024, 1, 2, 12)):
        update_with_signals(queryset, is_role_active=False)

    unit_role.refresh_from_db()
    assert unit_role.updated_at == local_datetime(2024, 1, 2, 12)


def test_update_with_signals__keeps_given_auto_now_value():
    unit_role = UnitRoleFactory.create(is_role_active=True)

    queryset = UnitRole.objects.filter(pk=unit_role.pk)
    update_with_signals(queryset, is_role_active=False, updated_at=local_datetime(2020, 1, 1, 12))

    unit_role.refresh_from_db()
    assert unit_role.updated_at == local_datetime(2020, 1, 1, 12)


def test_update_with_signals__row_changed_while_waiting_for_lock():
    changed_role = UnitRoleFactory.create(role=UserRoleChoice.ADMIN, is_role_active=True)
    unchanged_role = UnitRoleFactory.create(role=UserRoleChoice.ADMIN, is_role_active=True)

    # Simulates a parallel write that commits while 'update_with_signals' waits for the row lock.
    def deactivate_role_after_lock(execute, sql, params, many, context):
        result = execute(sql, params, many, context)
        if "FOR UPDATE" in sql:
            UnitRole.objects.filter(pk=changed_role.pk).update(is_role_active=False)
        return result

    queryset = UnitRole.objects.filter(is_role_active=True)

    with connection.execute_wrapper(deactivate_role_after_lock):
        count = update_with_signals(queryset, role=UserRoleChoice.VIEWER)

    assert count == 1

    changed_role.refresh_from_db()
    assert changed_role.role == UserRoleChoice.ADMIN

    unchanged_role.refresh_from_db()
    assert unchanged_role.role == UserRoleChoice.VIEWER


def test_update_with_signals__distinct_queryset_with_join():
    unit = UnitFactory.create()
    unit_role = UnitRoleFactory.create(is_role_active=True, units=[unit])

    queryset = UnitRole.objects.filter(units__in=[unit]).distinct()
    update_with_signals(queryset, is_role_active=False)

    unit_role.refresh_from_db()
    assert unit_role.is_role_active is False


def test_update_with_signals__not_a_concrete_field():
    queryset = UnitRole.objects.all()

    msg = "'units' is not a concrete field of 'UnitRole'."
    with pytest.raises(UpdateWithSignalsFieldError, match=exact(msg)):
        update_with_signals(queryset, units=[])
