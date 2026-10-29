from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest

from tilavarauspalvelu.tasks import refresh_reservation_unit_product_mapping_task

from tests.factories import PaymentMerchantFactory, ReservationUnitFactory, UnitFactory

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


@contextmanager
def mock_refresh_reservation_unit_product_mapping_task() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.tasks."
    path += refresh_reservation_unit_product_mapping_task.__name__
    path += ".delay"

    with patch(path) as mock:
        yield mock


# ── Product mapping ──


def test_unit__save__payment_merchant_changed__refreshes_reservation_units_without_own_merchant(settings):
    unit = UnitFactory.create()
    reservation_unit = ReservationUnitFactory.create(unit=unit, payment_merchant=None)
    ReservationUnitFactory.create(unit=unit, payment_merchant=PaymentMerchantFactory.create())

    settings.UPDATE_PRODUCT_MAPPING = True
    unit.payment_merchant = PaymentMerchantFactory.create()

    with mock_refresh_reservation_unit_product_mapping_task() as mock:
        unit.save()

    assert mock.call_count == 1
    assert mock.call_args.args == (reservation_unit.pk,)


def test_unit__save__payment_merchant_not_changed__does_not_refresh_reservation_units(settings):
    unit = UnitFactory.create(payment_merchant=PaymentMerchantFactory.create())
    ReservationUnitFactory.create(unit=unit, payment_merchant=None)

    settings.UPDATE_PRODUCT_MAPPING = True
    unit.name = "New name"

    with mock_refresh_reservation_unit_product_mapping_task() as mock:
        unit.save()

    assert mock.call_count == 0


def test_unit__save__product_mapping_updates_turned_off__does_not_refresh_reservation_units(settings):
    unit = UnitFactory.create()
    ReservationUnitFactory.create(unit=unit, payment_merchant=None)

    settings.UPDATE_PRODUCT_MAPPING = False
    unit.payment_merchant = PaymentMerchantFactory.create()

    with mock_refresh_reservation_unit_product_mapping_task() as mock:
        unit.save()

    assert mock.call_count == 0
