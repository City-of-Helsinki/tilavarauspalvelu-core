from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import patch_method

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit


@pytest.fixture(autouse=True)
def _force_HaukiAPIClient_to_be_mocked():
    """Force 'HaukiAPIClient.generic' to be mocked in all tests."""
    from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient

    exception = NotImplementedError("'HaukiAPIClient.request' must be mocked!")
    with patch_method(HaukiAPIClient.request, side_effect=exception):
        yield


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999, opening_hours_hash="abc123"),
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__origin_hauki_resource=OriginHaukiResourceFactory.create(id=888),
    )
