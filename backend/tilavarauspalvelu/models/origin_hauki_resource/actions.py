from __future__ import annotations

import dataclasses
import datetime
from typing import TYPE_CHECKING

from django.conf import settings

from utils.date_utils import local_date, local_start_of_day

if TYPE_CHECKING:
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

    def update_opening_hours_hash(self, new_date_periods_hash: str) -> None:
        """
        Update the opening hours hash and clear all future ReservableTimeSpans.

        When the hash has changed in HAUKI, it means that the rules for generating reservable times have changed,
        meaning all future ReservableTimeSpans are now invalid and should be deleted and be recreated.
        """
        ohr = self.origin_hauki_resource

        ohr.opening_hours_hash = new_date_periods_hash
        ohr.latest_fetched_date = None  # Set to None, to clarify that all future data is missing
        ohr.save()

        cutoff_date = local_date()  # All ReservableTimeSpans that start after this date will be deleted.

        # Old time spans are not deleted, as they are kept for archival purposes.
        ohr.reservable_time_spans.filter(start_datetime__gte=cutoff_date).delete()

        # If the cutoff_date is during a ReservableTimeSpan, end it at the cutoff date.
        # This way we can keep past data intact, and have the new data start from the cutoff date.
        ohr.reservable_time_spans.filter(end_datetime__gte=cutoff_date).update(end_datetime=local_start_of_day())

    def should_update_opening_hours(self, new_date_periods_hash: str) -> bool:
        """Return True if the opening hours should be updated from Hauki API."""
        ohr = self.origin_hauki_resource

        return (
            not ohr.opening_hours_hash
            or ohr.latest_fetched_date is None
            or ohr.latest_fetched_date < (local_date() + datetime.timedelta(days=settings.HAUKI_DAYS_TO_FETCH))
            or ohr.opening_hours_hash != new_date_periods_hash
        )
