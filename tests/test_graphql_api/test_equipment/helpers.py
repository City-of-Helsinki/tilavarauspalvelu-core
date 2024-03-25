from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

equipments_query = partial(build_query, "equipments", connection=True)

CREATE_MUTATION = build_mutation("createEquipment", "EquipmentCreateMutation")
UPDATE_MUTATION = build_mutation("updateEquipment", "EquipmentUpdateMutation")
