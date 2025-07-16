from __future__ import annotations

from functools import partial

equipments_query = partial(build_query, "equipments", connection=True)
equipments_all_query = partial(build_query, "equipmentsAll", connection=False)

CREATE_MUTATION = build_mutation("createEquipment", "EquipmentCreateMutation")
UPDATE_MUTATION = build_mutation("updateEquipment", "EquipmentUpdateMutation")
