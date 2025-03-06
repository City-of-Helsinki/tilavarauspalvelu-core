from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import datetime

    from .model import OriginHaukiResource


__all__ = [
    "OriginHaukiResourceActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class OriginHaukiResourceActions:
    origin_hauki_resource: OriginHaukiResource

    def is_reservable(self, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> bool:
        return self.origin_hauki_resource.reservable_time_spans.fully_fill_period(
            start=start_datetime,
            end=end_datetime,
        ).exists()
