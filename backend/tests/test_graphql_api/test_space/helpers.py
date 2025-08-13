from __future__ import annotations

from functools import partial

from tests.query_builder import build_mutation, build_query

spaces_query = partial(build_query, "spaces", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createSpace", "SpaceCreateMutation")
UPDATE_MUTATION = build_mutation("updateSpace", "SpaceUpdateMutation")
DELETE_MUTATION = build_mutation("deleteSpace", "SpaceDeleteMutation")
