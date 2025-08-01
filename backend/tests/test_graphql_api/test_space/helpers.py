from __future__ import annotations

from functools import partial

spaces_query = partial(build_query, "spaces", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation("createSpace", "SpaceCreateMutation")
UPDATE_MUTATION = build_mutation("updateSpace", "SpaceUpdateMutation")
DELETE_MUTATION = build_mutation("deleteSpace", "SpaceDeleteMutation", fields="deleted")
