from functools import partial

from graphene_django_extensions.testing import build_query

rounds_query = partial(build_query, "applicationRounds", connection=True, order_by="pkAsc")
