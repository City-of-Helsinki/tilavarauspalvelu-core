from functools import partial

from tests.helpers import build_query

reservations_query = partial(build_query, "reservations", connection=True, order_by="pk")
