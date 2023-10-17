from typing import TYPE_CHECKING, TypeAlias, Union

from django.contrib.auth.models import AnonymousUser
from django.core.handlers.wsgi import WSGIRequest
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    from users.models import User

__all__ = [
    "AnyUser",
    "GQLInfo",
]

AnyUser: TypeAlias = Union["User", AnonymousUser]


class UserHintedWSGIRequest(WSGIRequest):
    user: AnyUser


class GQLInfo(GraphQLResolveInfo):
    context = UserHintedWSGIRequest
