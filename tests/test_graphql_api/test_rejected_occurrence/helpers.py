from functools import partial

from graphene_django_extensions.testing import build_query

rejected_occurrence_query = partial(build_query, "rejectedOccurrences", connection=True, order_by="pkAsc")
