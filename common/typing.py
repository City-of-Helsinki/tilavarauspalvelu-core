from typing import TYPE_CHECKING, Union

from django.contrib.auth.models import AnonymousUser
from django.core.handlers.wsgi import WSGIRequest
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    from users.models import User

__all__ = [
    "AnyUser",
    "GQLInfo",
]

type AnyUser = Union["User", AnonymousUser]  # noqa: UP007


class UserHintedWSGIRequest(WSGIRequest):
    user: AnyUser


class GQLInfo(GraphQLResolveInfo):
    context = UserHintedWSGIRequest
