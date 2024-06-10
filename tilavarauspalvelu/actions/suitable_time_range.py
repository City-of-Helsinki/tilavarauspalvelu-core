from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import SuitableTimeRange


class SuitableTimeRangeActions:
    def __init__(self, suitable_time_range: "SuitableTimeRange") -> None:
        self.suitable_time_range = suitable_time_range
