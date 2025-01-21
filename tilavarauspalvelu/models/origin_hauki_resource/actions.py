from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import datetime

    from .model import OriginHaukiResource


class OriginHaukiResourceActions:
    def __init__(self, origin_hauki_resource: OriginHaukiResource) -> None:
        self.origin_hauki_resource = origin_hauki_resource

    def is_reservable(self, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> bool:
        return self.origin_hauki_resource.reservable_time_spans.fully_fill_period(
            start=start_datetime,
            end=end_datetime,
        ).exists()
