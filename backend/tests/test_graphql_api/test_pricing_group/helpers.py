from __future__ import annotations

from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

pricing_group_query = partial(build_query, "pricingGroup")

UPDATE_COMPONENTS_MUTATION = build_mutation("updatePricingGroupComponents", "PricingGroupComponentsUpdateMutation")
