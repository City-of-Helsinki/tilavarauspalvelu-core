from __future__ import annotations

from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

intended_uses_query = partial(build_query, "intendedUses", connection=True)

CREATE_MUTATION = build_mutation("createIntendedUse", "IntendedUseCreateMutation")
UPDATE_MUTATION = build_mutation("updateIntendedUse", "IntendedUseUpdateMutation")
