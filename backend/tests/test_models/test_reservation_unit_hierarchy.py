from __future__ import annotations

import pytest

from tilavarauspalvelu.models import ReservationUnitHierarchy

from tests.factories import ReservationUnitFactory, SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_hierarchy__refreshed_after_commit(settings, django_capture_on_commit_callbacks):
    settings.UPDATE_RESERVATION_UNIT_HIERARCHY = True

    with django_capture_on_commit_callbacks(execute=True):
        reservation_unit = ReservationUnitFactory.create(spaces=[SpaceFactory.create()])

        assert ReservationUnitHierarchy.objects.filter(reservation_unit=reservation_unit).exists() is False

    assert ReservationUnitHierarchy.objects.filter(reservation_unit=reservation_unit).exists() is True
