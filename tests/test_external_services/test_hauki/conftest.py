from unittest import mock

import pytest

from reservation_units.models import ReservationUnit
from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory


@pytest.fixture(autouse=True)
def _force_HaukiAPIClient_to_be_mocked():
    """Force 'HaukiAPIClient.generic' to be mocked in all tests."""
    with mock.patch(
        "opening_hours.utils.hauki_api_client.HaukiAPIClient.generic",
        side_effect=NotImplementedError("'HaukiAPIClient.generic' must be mocked!"),
    ):
        yield


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999, opening_hours_hash="abc123"),
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__origin_hauki_resource=OriginHaukiResourceFactory(id=888),
    )
