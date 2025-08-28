from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.tasks import notify_reservation_on_access_type_change_task
from utils.date_utils import local_date, local_datetime

from tests.factories import ReservationFactory, ReservationUnitAccessTypeFactory, ReservationUnitFactory

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock


@contextmanager
def mock_notify_reservation_on_access_type_change_task() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.models.reservation_unit.actions."
    path += notify_reservation_on_access_type_change_task.__name__
    path += ".delay"

    with patch(path) as mock:
        yield mock


@pytest.mark.django_db
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_reservation_unit_update_access_types_for_reservations():
    reservation_unit = ReservationUnitFactory.create()

    ReservationUnitAccessTypeFactory.create(
        begin_date=local_date(2024, 1, 1),
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
    )
    ReservationUnitAccessTypeFactory.create(
        begin_date=local_date(2024, 1, 2),
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
    )

    # Access type not changed
    ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 12),
        ends_at=local_datetime(2024, 1, 1, 13),
        access_type=AccessType.UNRESTRICTED,
    )
    # Access type changed
    reservation_1 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 1, 14),
        ends_at=local_datetime(2024, 1, 1, 15),
        access_type=AccessType.OPENED_BY_STAFF,
    )
    # Access type changed (another type)
    reservation_2 = ReservationFactory.create(
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CONFIRMED,
        begins_at=local_datetime(2024, 1, 2, 12),
        ends_at=local_datetime(2024, 1, 2, 13),
        access_type=AccessType.UNRESTRICTED,
    )

    with mock_notify_reservation_on_access_type_change_task() as mock:
        reservation_unit.actions.update_access_types_for_reservations()

    assert mock.call_count == 1

    assert mock.call_args.kwargs == {"reservation_pks": [reservation_1.pk, reservation_2.pk]}

    reservation_1.refresh_from_db()
    assert reservation_1.access_type == AccessType.UNRESTRICTED

    reservation_2.refresh_from_db()
    assert reservation_2.access_type == AccessType.OPENED_BY_STAFF
