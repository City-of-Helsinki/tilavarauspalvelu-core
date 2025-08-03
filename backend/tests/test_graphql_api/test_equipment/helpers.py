from __future__ import annotations

from functools import partial

from tests.query_builder import build_mutation, build_query

equipments_query = partial(build_query, "equipments", connection=True)
equipments_all_query = partial(build_query, "equipmentsAll", connection=False)

CREATE_MUTATION = build_mutation("createEquipment", "EquipmentCreateMutation")
UPDATE_MUTATION = build_mutation("updateEquipment", "EquipmentUpdateMutation")
