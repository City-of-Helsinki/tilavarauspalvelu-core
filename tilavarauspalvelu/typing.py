from __future__ import annotations

from typing import TYPE_CHECKING, Any, Literal, Protocol, TypedDict

from django.contrib.auth.models import AnonymousUser
from django.core.handlers import wsgi
from graphql import GraphQLResolveInfo

if TYPE_CHECKING:
    import datetime

    from django.contrib.sessions.backends.cache import SessionStore

    from tilavarauspalvelu.models import User


__all__ = [
    "AffectedTimeSpan",
    "AnyUser",
    "EmailContext",
    "EmailData",
    "GQLInfo",
    "Lang",
    "M2MAction",
    "QueryInfo",
    "SessionMapping",
    "TimeSlot",
    "TimeSlotDB",
    "WSGIRequest",
    "permission",
]


class permission(classmethod): ...  # noqa: N801


type AnyUser = User | AnonymousUser
type Lang = Literal["fi", "sv", "en"]
type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
type EmailContext = dict[str, str | None]


class AffectedTimeSpan(TypedDict):
    start_datetime: str
    end_datetime: str
    buffer_time_before: str
    buffer_time_after: str
    is_blocking: bool


class TimeSlot(TypedDict):
    begin: datetime.time
    end: datetime.time


class TimeSlotDB(TypedDict):
    """
    Timeslots must be stored as string in HSField,
    but we want to use `datetime.time` in the code.
    """

    begin: str  # datetime.time
    end: str  # datetime.time


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


class SessionMapping(Protocol):
    def __setitem__(self, key: str, value: Any) -> None: ...

    def get(self, key: str, default: Any = None) -> Any: ...


class EmailAttachment(TypedDict):
    filename: str
    content: str
    mimetype: str


class EmailData(TypedDict):
    recipients: list[str]
    subject: str
    text_content: str
    html_content: str
    attachments: list[EmailAttachment]
