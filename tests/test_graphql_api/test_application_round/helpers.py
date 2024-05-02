from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

rounds_query = partial(build_query, "applicationRounds", connection=True, order_by="pkAsc")

SET_HANDLED_MUTATION = build_mutation(
    "setApplicationRoundHandled",
    "SetApplicationRoundHandledMutation",
)
