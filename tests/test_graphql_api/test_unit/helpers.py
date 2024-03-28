from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

units_query = partial(build_query, "units", connection=True, order_by="nameFiAsc")

UPDATE_MUTATION = build_mutation("updateUnit", "UnitUpdateMutation")
