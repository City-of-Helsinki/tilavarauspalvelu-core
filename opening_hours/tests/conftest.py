import pytest

from opening_hours.enums import ResourceType
from opening_hours.resources import HaukiResource
from reservation_units.models import ReservationUnit
from tests.factories import ReservationUnitFactory


@pytest.fixture(autouse=True)
def _use_hauki_env_variables(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_API_KEY = "secret_key"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "test-tvp"
    settings.HAUKI_SECRET = "super_secret"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = "parent-organisation"
    settings.HAUKI_ADMIN_UI_URL = "http://test.com/admin"


@pytest.fixture()
def hauki_resource() -> HaukiResource:
    return HaukiResource(
        id=None,
        name="Test Resource",
        description="",
        address="",
        children=[],
        parents=[1],
        organization="1234",
        origin_id="4321",
        origin_data_source_name="DataSource",
        origin_data_source_id="dts",
        resource_type=ResourceType.RESERVABLE,
    )


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    return ReservationUnitFactory(
        unit__tprek_id=1234,
        unit__tprek_department_id=4321,
        unit__hauki_resource_id=1,
    )
