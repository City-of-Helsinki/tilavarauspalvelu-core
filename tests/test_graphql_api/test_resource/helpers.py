from functools import partial

from tests.gql_builders import build_mutation, build_query

resources_query = partial(build_query, "resources", connection=True)
resource_by_pk_query = partial(build_query, "resourceByPk")


CREATE_MUTATION = build_mutation(
    "createResource",
    "ResourceCreateMutationInput",
)
UPDATE_MUTATION = build_mutation(
    "updateResource",
    "ResourceUpdateMutationInput",
)
DELETE_MUTATION = build_mutation("deleteResource", "ResourceDeleteMutationInput", selections="deleted errors")
