import datetime
from dataclasses import dataclass
from typing import Annotated, Any, Self

from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import F, Q, QuerySet, Subquery, Sum

from applications.models import ApplicationRound
from common.date_utils import local_datetime
from common.db import ArrayRemove
from merchants.models import OrderStatus
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.models import ReservationUnit
from reservation_units.querysets import ReservationUnitQuerySet
from reservations.choices import ReservationStateChoice, ReservationTypeChoice

ReservationUnitPK = Annotated[int, "ReservationUnit PK"]
SpacePK = Annotated[int, "Space PK"]
ResourcePK = Annotated[int, "Resource PK"]


@dataclass
class ReservationUnitInfo:
    pk: ReservationUnitPK
    space_ids: set[SpacePK]
    resource_ids: set[ResourcePK]

    def __init__(self, reservation_unit_values: dict[str, Any]) -> None:
        self.pk = reservation_unit_values["pk"]
        self.space_ids = set(reservation_unit_values["space_ids"])
        self.resource_ids = set(reservation_unit_values["resource_ids"])


@dataclass
class ReservationInfo:
    is_blocking_reservation: bool
    time_span: TimeSpanElement
    reservation_unit_id: ReservationUnitPK
    space_ids: set[SpacePK]
    resource_ids: set[ResourcePK]

    def __init__(self, reservation_values: dict[str, Any]) -> None:
        # BLOCKED-type reservations should be treated differently than normal reservations.
        # They are not reservable, they don't have a buffer time, and other reservation buffer times can overlap them.
        self.is_blocking_reservation = reservation_values["type"] == ReservationTypeChoice.BLOCKED.value
        self.time_span = TimeSpanElement(
            start_datetime=reservation_values["begin"],
            end_datetime=reservation_values["end"],
            is_reservable=False,
            buffer_time_before=reservation_values["buffer_time_before"] if not self.is_blocking_reservation else None,
            buffer_time_after=reservation_values["buffer_time_after"] if not self.is_blocking_reservation else None,
        )
        self.reservation_unit_id = reservation_values["reservation_unit__id"]
        self.space_ids = set(reservation_values["space_ids"])
        self.resource_ids = set(reservation_values["resource_ids"])


class ReservationQuerySet(QuerySet):
    def get_affecting_reservations_as_closed_time_spans(
        self,
        reservation_unit_queryset: ReservationUnitQuerySet,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> tuple[dict[ReservationUnitPK, set[TimeSpanElement]], dict[ReservationUnitPK, set[TimeSpanElement]]]:
        """
        Get all reservations that affect the given reservation units and period as closed time spans.

        Returns a tuple of two dictionaries:
        - Reservations, that affect the reservation units, as closed time spans.
        - BLOCKED-type reservations, that affect the reservation units, as closed time spans.
        The difference between the two is that BLOCKED reservations are treated differently than normal reservations.
        (They are not reservable, they don't have a buffer time, and other reservation buffer times can overlap them.)
        """
        from spaces.models import Space

        reservation_unit_queryset = (
            reservation_unit_queryset.distinct()
            .order_by("pk")
            .annotate(
                space_ids=ArrayRemove(ArrayAgg("spaces__id"), None),
                resource_ids=ArrayRemove(ArrayAgg("resources__id"), None),
            )
            .values("pk", "space_ids", "resource_ids")
        )
        reservation_unit_infos = [ReservationUnitInfo(item) for item in reservation_unit_queryset]

        # Sets that contain all space and resource ids from the reservation units.
        direct_space_ids: set[SpacePK] = {pk for item in reservation_unit_infos for pk in item.space_ids}
        resource_ids: set[ResourcePK] = {pk for item in reservation_unit_infos for pk in item.resource_ids}

        # Map each space in the queryset with their "family".
        space_to_family: dict[SpacePK, set[SpacePK]] = Space.objects.filter(id__in=direct_space_ids).space_to_family()
        # Set that contain all space ids from the all the space families.
        space_ids: set[SpacePK] = {pk for family in space_to_family.values() for pk in family if pk is not None}

        # Reservations that are on the given period and contain any of the given spaces or resources.
        reservation_queryset = (
            self.filter_buffered_reservations_period(start_date=start_date, end_date=end_date)
            .going_to_occur()
            .filter(
                Q(reservation_unit__id__in=[info.pk for info in reservation_unit_infos])
                | Q(reservation_unit__spaces__in=space_ids)
                | Q(reservation_unit__resources__in=resource_ids),
            )
            .annotate(
                space_ids=ArrayRemove(ArrayAgg("reservation_unit__spaces__id", distinct=True), None),
                resource_ids=ArrayRemove(ArrayAgg("reservation_unit__resources__id", distinct=True), None),
            )
            .values(
                "begin",
                "end",
                "buffer_time_before",
                "buffer_time_after",
                "reservation_unit__id",
                "space_ids",
                "resource_ids",
                "type",
            )
        )
        reservation_infos = [ReservationInfo(item) for item in reservation_queryset]

        reservation_time_spans: dict[ReservationUnitPK, set[TimeSpanElement]] = {}
        blocked_time_spans: dict[ReservationUnitPK, set[TimeSpanElement]] = {}

        def _use_reservation_time_span(
            reservation_unit_id: ReservationUnitPK,
            reservation_info: ReservationInfo,
        ) -> None:
            """Add the reservation time span to the correct dictionary."""
            if reservation_info.is_blocking_reservation:
                blocked_time_spans.setdefault(reservation_unit_id, set())
                blocked_time_spans[reservation_unit_id].add(reservation_info.time_span)
            else:
                reservation_time_spans.setdefault(reservation_unit_id, set())
                reservation_time_spans[reservation_unit_id].add(reservation_info.time_span)

        for reservation_info in reservation_infos:
            # Still add this reservation for the reservation unit if it doesn't have any spaces or resources.
            if not reservation_info.space_ids and not reservation_info.resource_ids:
                _use_reservation_time_span(reservation_info.reservation_unit_id, reservation_info)
                continue

            # Spaces
            for space_id in reservation_info.space_ids:
                # Get the full family of the space.
                family: set[SpacePK] = space_to_family.get(space_id)

                # Space is not related in common hierarchy with any of the reservation units, skip it.
                if family is None:
                    continue

                for reservation_unit_info in reservation_unit_infos:
                    # If any space from the family is a direct space on the reservation unit,
                    # add a timespan from the reservation to the reservation unit, but only once.
                    if reservation_unit_info.space_ids.intersection(family):
                        _use_reservation_time_span(reservation_unit_info.pk, reservation_info)

            # Resources
            for reservation_unit_info in reservation_unit_infos:
                if reservation_unit_info.resource_ids.intersection(reservation_info.resource_ids):
                    _use_reservation_time_span(reservation_unit_info.pk, reservation_info)

        return reservation_time_spans, blocked_time_spans

    def with_buffered_begin_and_end(self: Self) -> Self:
        """Annotate the queryset with buffered begin and end times."""
        return self.annotate(
            buffered_begin=F("begin") - F("buffer_time_before"),
            buffered_end=F("end") + F("buffer_time_after"),
        )

    def filter_buffered_reservations_period(self: Self, start_date: datetime.date, end_date: datetime.date) -> Self:
        """Filter reservations that are on the given period."""
        return (
            self.with_buffered_begin_and_end()
            .filter(
                buffered_begin__date__lte=end_date,
                buffered_end__date__gte=start_date,
            )
            .distinct()
            .order_by("buffered_begin")
        )

    def total_duration(self: Self) -> datetime.timedelta:
        return (
            self.annotate(duration=F("end") - F("begin"))
            .aggregate(total_duration=Sum("duration"))
            .get("total_duration")
        ) or datetime.timedelta()

    def total_seconds(self: Self) -> int:
        return int(self.total_duration().total_seconds())

    def within_application_round_period(self: Self, app_round: ApplicationRound) -> Self:
        return self.within_period(
            app_round.reservation_period_begin,
            app_round.reservation_period_end,
        )

    def within_period(self: Self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservation fully withing a period."""
        return self.filter(
            begin__date__gte=period_start,
            end__date__lte=period_end,
        )

    def overlapping_period(self: Self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservations that overlap with a period, even partially."""
        return self.filter(
            begin__date__lte=period_end,
            end__date__gte=period_start,
        )

    def going_to_occur(self: Self):
        return self.filter(
            state__in=(
                ReservationStateChoice.CREATED,
                ReservationStateChoice.CONFIRMED,
                ReservationStateChoice.WAITING_FOR_PAYMENT,
                ReservationStateChoice.REQUIRES_HANDLING,
            )
        )

    def active(self: Self) -> Self:
        """
        Filter reservations that have not ended yet.

        Note:
        - There might be older reservations with buffers that are still active,
          even if the reservation itself is not returned by this queryset.
        - Returned data may contain some 'Inactive' reservations, before they are deleted by a periodic task.
        """
        return self.going_to_occur().filter(end__gte=local_datetime())

    def inactive(self: Self, older_than_minutes: int) -> Self:
        """Filter 'draft' reservations, which are older than X minutes old, and can be assumed to be inactive."""
        return self.filter(
            state=ReservationStateChoice.CREATED,
            created_at__lte=local_datetime() - datetime.timedelta(minutes=older_than_minutes),
        )

    def with_inactive_payments(self: Self) -> Self:
        expiration_time = local_datetime() - datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        return self.filter(
            state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            payment_order__remote_id__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__created_at__lte=expiration_time,
        )

    def affecting_reservations(self: Self, units: list[int] = (), reservation_units: list[int] = ()) -> Self:
        """Filter reservations that affect other reservations in the given units and/or reservation units."""
        qs = ReservationUnit.objects.all()
        if units:
            qs = qs.filter(unit__in=units)
        if reservation_units:
            qs = qs.filter(pk__in=reservation_units)

        return self.filter(
            reservation_unit__in=Subquery(
                queryset=qs.reservation_units_with_common_hierarchy().values_list("pk", flat=True),
            ),
        ).exclude(
            # Cancelled or denied reservations never affect any reservations
            state__in=[
                ReservationStateChoice.CANCELLED,
                ReservationStateChoice.DENIED,
            ]
        )
