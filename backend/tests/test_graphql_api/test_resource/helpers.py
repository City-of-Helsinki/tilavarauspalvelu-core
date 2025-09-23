from __future__ import annotations

from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

resource_query = partial(build_query, "resource")
resources_query = partial(build_query, "resources", connection=True)


CREATE_MUTATION = build_mutation("createResource", "ResourceCreateMutation")
UPDATE_MUTATION = build_mutation("updateResource", "ResourceUpdateMutation")
DELETE_MUTATION = build_mutation("deleteResource", "ResourceDeleteMutation", fields="deleted")
