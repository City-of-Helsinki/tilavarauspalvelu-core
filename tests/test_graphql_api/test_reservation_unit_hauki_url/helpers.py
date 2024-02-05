from functools import partial

from tests.gql_builders import build_query

reservation_unit_hauki_url_query = partial(build_query, "reservationUnitHaukiUrl", fields="url")
