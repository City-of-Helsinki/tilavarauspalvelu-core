from __future__ import annotations

from typing import Literal, TypedDict


class permission(classmethod): ...  # noqa: N801


type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]


class AffectedTimeSpan(TypedDict):
    start_datetime: str
    end_datetime: str
    buffer_time_before: str
    buffer_time_after: str
    is_blocking: bool
