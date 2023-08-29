from django.core.handlers.wsgi import WSGIRequest
from graphql import GraphQLResolveInfo

__all__ = [
    "GQLInfo",
]


class GQLInfo(GraphQLResolveInfo):
    context = WSGIRequest
