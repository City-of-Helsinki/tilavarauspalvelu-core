from functools import partial

from tests.gql_builders import build_mutation, build_query

equipments_query = partial(build_query, "equipments", connection=True)

CREATE_MUTATION = build_mutation(
    "createEquipment",
    "EquipmentCreateMutationInput",
)
UPDATE_MUTATION = build_mutation(
    "updateEquipment",
    "EquipmentUpdateMutationInput",
)
