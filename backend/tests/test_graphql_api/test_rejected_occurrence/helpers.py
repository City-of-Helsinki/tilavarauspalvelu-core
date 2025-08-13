from __future__ import annotations

from functools import partial

from tests.query_builder import build_query

rejected_occurrence_query = partial(build_query, "rejectedOccurrences", connection=True, order_by="pkAsc")
