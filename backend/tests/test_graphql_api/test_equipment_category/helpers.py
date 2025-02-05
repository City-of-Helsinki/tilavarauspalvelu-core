from __future__ import annotations

from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

equipment_categories_query = partial(build_query, "equipmentCategories", connection=True)

CREATE_MUTATION = build_mutation("createEquipmentCategory", "EquipmentCategoryCreateMutation")
UPDATE_MUTATION = build_mutation("updateEquipmentCategory", "EquipmentCategoryUpdateMutation")
