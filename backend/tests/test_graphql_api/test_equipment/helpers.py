from __future__ import annotations

from functools import partial

from tests.query_builder import build_query

equipments_query = partial(build_query, "allEquipments")
