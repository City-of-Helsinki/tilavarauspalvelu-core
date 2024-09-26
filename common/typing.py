from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, Protocol, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.handlers import wsgi
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    from django.contrib.sessions.backends.cache import SessionStore

    from tilavarauspalvelu.models import User

__all__ = [
    "AnyUser",
    "GQLInfo",
    "QueryInfo",
    "SessionMapping",
    "WSGIRequest",
]

type AnyUser = User | AnonymousUser


class WSGIRequest(wsgi.WSGIRequest):
    user: AnyUser
    session: SessionStore


class GQLInfo(GraphQLResolveInfo):
    context = WSGIRequest


class QueryInfo(TypedDict):
    sql: str
    duration_ns: int
    succeeded: bool
    stack_info: str


type Lang = Literal["fi", "sv", "en"]


class SessionMapping(Protocol):
    def __setitem__(self, key: str, value: Any) -> None: ...

    def get(self, key: str, default: Any = None) -> Any: ...
