from functools import partial

from tests.gql_builders import build_query

rounds_query = partial(build_query, "applicationRounds", connection=True, order_by="pk")
