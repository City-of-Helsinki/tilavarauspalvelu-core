from __future__ import annotations

import datetime
from typing import TYPE_CHECKING
from unittest.mock import call, patch

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting_task

from tests.factories import ReservationUnitFactory, ReservationUnitPricingGroupFactory

if TYPE_CHECKING:
    from pytest_django import DjangoCaptureOnCommitCallbacks, Settings

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Begin date ──


def test_reservation_unit_pricing_group__one_group_per_reservation_unit_and_date() -> None:
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    with pytest.raises(IntegrityError) as error:
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    assert "reservation_unit_pricing_group_begins_unique" in str(error.value)


# ── Accounting ──


def test_reservation_unit_pricing_group__save_sends_accounting_of_the_reservation_unit(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    settings.UPDATE_ACCOUNTING = True
    reservation_unit = ReservationUnitFactory.create()

    with (
        patch.object(refresh_reservation_unit_accounting_task, "apply_async") as mock,
        django_capture_on_commit_callbacks(execute=True),
    ):
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit)

    assert mock.call_args_list == [call(kwargs={"reservation_unit_pks": [reservation_unit.pk]})]


def test_reservation_unit_pricing_group__delete_sends_accounting_of_the_reservation_unit(
    settings: Settings, django_capture_on_commit_callbacks: DjangoCaptureOnCommitCallbacks
) -> None:
    reservation_unit = ReservationUnitFactory.create()
    row = ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit)

    settings.UPDATE_ACCOUNTING = True

    with (
        patch.object(refresh_reservation_unit_accounting_task, "apply_async") as mock,
        django_capture_on_commit_callbacks(execute=True),
    ):
        row.delete()

    assert mock.call_args_list == [call(kwargs={"reservation_unit_pks": [reservation_unit.pk]})]
