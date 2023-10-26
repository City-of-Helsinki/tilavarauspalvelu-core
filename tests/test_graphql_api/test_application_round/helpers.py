from functools import partial

from tests.helpers import build_query

rounds_query = partial(build_query, "applicationRounds", connection=True, order_by="pk")
