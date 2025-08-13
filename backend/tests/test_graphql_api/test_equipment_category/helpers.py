from __future__ import annotations

from functools import partial

from tests.query_builder import build_mutation, build_query

equipment_categories_query = partial(build_query, "allEquipmentCategories")

CREATE_MUTATION = build_mutation("createEquipmentCategory", "EquipmentCategoryCreateMutation")
UPDATE_MUTATION = build_mutation("updateEquipmentCategory", "EquipmentCategoryUpdateMutation")
