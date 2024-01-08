from functools import partial

import pytest

from tests.gql_builders import build_mutation, build_query

reservation_unit_hauki_url_query = partial(build_query, "reservationUnitHaukiUrl", connection=False, fields="url")

reservation_units_query = partial(build_query, "reservationUnits", connection=True)

reservation_unit_by_pk_query = partial(build_query, "reservationUnitByPk", connection=False)

reservation_unit_create_mutation = build_mutation("createReservationUnit", "ReservationUnitCreateMutationInput")

reservation_unit_update_mutation = partial(
    build_mutation,
    "updateReservationUnit",
    "ReservationUnitUpdateMutationInput",
)


@pytest.fixture(autouse=True)
def _setup_hauki_env_variables(settings):
    settings.HAUKI_API_URL = "url"
    settings.HAUKI_EXPORTS_ENABLED = None
    settings.HAUKI_ORIGIN_ID = "origin"
    settings.HAUKI_SECRET = "HAUKISECRET"  # noqa: S105
    settings.HAUKI_ORGANISATION_ID = None
    settings.HAUKI_ADMIN_UI_URL = "https://test.com"
