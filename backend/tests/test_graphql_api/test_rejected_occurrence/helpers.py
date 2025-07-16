from __future__ import annotations

from functools import partial

rejected_occurrence_query = partial(build_query, "rejectedOccurrences", connection=True, order_by="pkAsc")
