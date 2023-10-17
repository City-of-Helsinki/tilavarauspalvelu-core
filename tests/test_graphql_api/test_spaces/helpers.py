from functools import partial

from tests.helpers import build_mutation, build_query

spaces_query = partial(build_query, "spaces", connection=True, order_by="pk")

CREATE_MUTATION = build_mutation(
    "createSpace",
    "SpaceCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateSpace",
    "SpaceUpdateMutationInput",
)

DELETE_MUTATION = build_mutation(
    "deleteSpace",
    "SpaceDeleteMutationInput",
    selections="deleted errors",
)
