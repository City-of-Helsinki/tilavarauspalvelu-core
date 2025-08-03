from __future__ import annotations

from functools import partial

from tests.query_builder import build_mutation, build_query

purposes_query = partial(build_query, "purposes", connection=True)

CREATE_MUTATION = build_mutation("createPurpose", "PurposeCreateMutation")
UPDATE_MUTATION = build_mutation("updatePurpose", "PurposeUpdateMutation")
