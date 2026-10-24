from __future__ import annotations

import datetime

import pytest
from django.db import IntegrityError

from tests.factories import ReservationUnitFactory, ReservationUnitPricingGroupFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Begin date ──


def test_reservation_unit_pricing_group__one_group_per_reservation_unit_and_date():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    with pytest.raises(IntegrityError) as error:
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    assert "reservation_unit_pricing_group_begins_unique" in str(error.value)
