from __future__ import annotations

from collections import defaultdict
from typing import TYPE_CHECKING, Literal

from django.db import models
from django.db.models import Prefetch

from opening_hours.utils.time_span_element import TimeSpanElement
from reservations.choices import ReservationTypeChoice

if TYPE_CHECKING:
    import datetime

    from reservation_units.querysets import ReservationUnitQuerySet


__all__ = [
    "AffectingReservationHelper",
    "ReservationUnitPK",
    "ResourcePK",
    "SpacePK",
]

type ReservationUnitPK = int
type SpacePK = int
type ResourcePK = int

type TimeSpanMap = dict[int, set[TimeSpanElement]]
type TimeSpansBy = dict[Literal["by_reservation_unit", "by_space", "by_resource"], TimeSpanMap]
type TimeSpans = dict[Literal["blocking", "non_blocking"], TimeSpansBy]


class AffectingReservationHelper:
    """
    Helper class for finding affecting reservations for a given set of reservation units (all by default)
    and exposing the as time span elements.
    """

    def __init__(
        self,
        *,
        start_date: datetime.date,
        end_date: datetime.date,
        reservation_unit_queryset: ReservationUnitQuerySet | None = None,
    ) -> None:
        from reservation_units.models import ReservationUnit
        from reservations.models import Reservation

        self.reservation_unit_queryset: ReservationUnitQuerySet = reservation_unit_queryset
        if self.reservation_unit_queryset is None:
            self.reservation_unit_queryset = ReservationUnit.objects.all().prefetch_related("spaces", "resources")

        self.reservation_queryset = (
            Reservation.objects.filter_buffered_reservations_period(start_date=start_date, end_date=end_date)
            .going_to_occur()
            .filter(reservation_unit__in=models.Subquery(self.reservation_unit_queryset.affected_reservation_unit_ids))
            .prefetch_related(
                Prefetch(
                    "reservation_unit",
                    queryset=ReservationUnit.objects.with_affecting_spaces().with_affecting_resources(),
                )
            )
        )
        self.time_spans: TimeSpans = {
            "blocking": {
                "by_reservation_unit": defaultdict(set),
                "by_space": defaultdict(set),
                "by_resource": defaultdict(set),
            },
            "non_blocking": {
                "by_reservation_unit": defaultdict(set),
                "by_space": defaultdict(set),
                "by_resource": defaultdict(set),
            },
        }

    def get_affecting_time_spans(self) -> tuple[TimeSpanMap, TimeSpanMap]:
        """
        Convert reservations into time span elements, and sort them into two dictionaries,
        both containing sets of time span elements by reservation unit ID that they affect.

        The difference between the two dictionaries is that the second dictionary contains time span elements
        for `BLOCKED` reservations, which are treated differently:
        - They are not reservable
        - They don't have a buffer time
        - Other reservation buffer times can overlap them
        """
        self._convert_reservations_into_time_spans()

        reservation_time_spans: TimeSpanMap = defaultdict(set)
        blocked_time_spans: TimeSpanMap = defaultdict(set)

        for reservation_unit in self.reservation_unit_queryset:
            non_blocking = self.time_spans["non_blocking"]
            blocking = self.time_spans["blocking"]

            if reservation_unit.pk in non_blocking["by_reservation_unit"]:
                reservation_time_spans[reservation_unit.id] |= non_blocking["by_reservation_unit"][reservation_unit.id]
            if reservation_unit.pk in blocking["by_reservation_unit"]:
                blocked_time_spans[reservation_unit.id] |= blocking["by_reservation_unit"][reservation_unit.id]

            for space in reservation_unit.spaces.all():
                if space.pk in non_blocking["by_space"]:
                    reservation_time_spans[reservation_unit.id] |= non_blocking["by_space"][space.pk]
                if space.pk in blocking["by_space"]:
                    blocked_time_spans[reservation_unit.id] |= blocking["by_space"][space.pk]

            for resource in reservation_unit.resources.all():
                if resource.pk in non_blocking["by_resource"]:
                    reservation_time_spans[reservation_unit.id] |= non_blocking["by_resource"][resource.pk]
                if resource.pk in blocking["by_resource"]:
                    blocked_time_spans[reservation_unit.id] |= blocking["by_resource"][resource.pk]

        return reservation_time_spans, blocked_time_spans

    def _convert_reservations_into_time_spans(self) -> None:
        """
        Convert reservations into time span elements, and sort them into three dictionaries
        (all containing sets of time span elements): by space ID, by resource ID, and by reservation ID.

        Each set contains the time span elements for all reservations that affect other reservations
        made to any reservation unit containing the entity in the dictionary key.
        """
        for reservation in self.reservation_queryset:
            is_blocking = reservation.type == ReservationTypeChoice.BLOCKED.value
            timespans = self.time_spans["blocking" if is_blocking else "non_blocking"]

            time_span = TimeSpanElement(
                start_datetime=reservation.begin,
                end_datetime=reservation.end,
                is_reservable=False,
                buffer_time_before=reservation.buffer_time_before if not is_blocking else None,
                buffer_time_after=reservation.buffer_time_after if not is_blocking else None,
            )

            for reservation_unit in reservation.reservation_unit.all():
                space_ids: list[SpacePK] = getattr(reservation_unit, "spaces_affecting_reservations", [])
                resource_ids: list[ResourcePK] = getattr(reservation_unit, "resources_affecting_reservations", [])

                # Reservation unit's own reservations always affect itself, even if it has not spaces or resources
                if not space_ids and not resource_ids:
                    timespans["by_reservation_unit"][reservation_unit.id].add(time_span)
                    continue

                for space_id in space_ids:
                    timespans["by_space"][space_id].add(time_span)

                for resource_id in resource_ids:
                    timespans["by_resource"][resource_id].add(time_span)
