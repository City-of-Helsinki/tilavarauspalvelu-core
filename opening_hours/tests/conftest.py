from unittest import mock

import pytest

from reservation_units.models import ReservationUnit
from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory


@pytest.fixture(autouse=True)
def _disable_elasticsearch(settings):
    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = False


@pytest.fixture(autouse=True)
def _use_hauki_env_variables(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_API_KEY = "secret_key"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "test-tvp"
    settings.HAUKI_SECRET = "super_secret"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = "parent-organisation"
    settings.HAUKI_ADMIN_UI_URL = "http://test.com/admin"


@pytest.fixture(autouse=True)
def _force_HaukiAPIClient_to_be_mocked():
    """Force 'HaukiAPIClient.generic' to be mocked in all tests."""
    with mock.patch(
        "opening_hours.utils.hauki_api_client.HaukiAPIClient.generic",
        side_effect=NotImplementedError("'HaukiAPIClient.generic' must be mocked!"),
    ):
        yield


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999, opening_hours_hash="abc123"),
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__origin_hauki_resource=OriginHaukiResourceFactory(id=888),
    )
