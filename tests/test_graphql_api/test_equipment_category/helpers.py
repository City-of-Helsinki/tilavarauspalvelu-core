from functools import partial

from tests.gql_builders import build_mutation, build_query

equipment_categories_query = partial(build_query, "equipmentCategories", connection=True)

CREATE_MUTATION = build_mutation(
    "createEquipmentCategory",
    "EquipmentCategoryCreateMutationInput",
)
UPDATE_MUTATION = build_mutation(
    "updateEquipmentCategory",
    "EquipmentCategoryUpdateMutationInput",
)
