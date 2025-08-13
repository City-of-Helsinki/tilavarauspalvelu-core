from __future__ import annotations

from functools import partial

from tests.query_builder import build_query

units_query = partial(build_query, "allUnits", order_by="nameFiAsc")
