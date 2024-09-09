from __future__ import annotations

from typing import TYPE_CHECKING, Literal, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.handlers.wsgi import WSGIRequest
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    from django.contrib.sessions.backends.cache import SessionStore

    from users.models import User

__all__ = [
    "AnyUser",
    "GQLInfo",
    "QueryInfo",
]

type AnyUser = User | AnonymousUser


class TypeHintedWSGIRequest(WSGIRequest):
    user: AnyUser
    session: SessionStore


class GQLInfo(GraphQLResolveInfo):
    context = TypeHintedWSGIRequest


class QueryInfo(TypedDict):
    sql: str
    duration_ns: int
    succeeded: bool
    stack_info: str


type Lang = Literal["fi", "sv", "en"]
