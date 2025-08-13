from __future__ import annotations

from functools import partial

from tests.query_builder import build_query

unit_groups_query = partial(build_query, "allUnitGroups")
