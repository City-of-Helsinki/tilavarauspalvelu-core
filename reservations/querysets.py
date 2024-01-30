from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Annotated, Any, Self

from django.contrib.postgres.aggregates import ArrayAgg
from django.db.models import DurationField, F, Manager, Q, QuerySet, Sum
from django.db.models.functions import Coalesce
from helsinki_gdpr.models import SerializableMixin

from applications.models import ApplicationRound
from common.date_utils import local_datetime
from common.db import ArrayRemove
from merchants.models import OrderStatus
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.models import ReservationUnit
from reservation_units.querysets import ReservationUnitQuerySet
from reservations.choices import ReservationStateChoice

ReservationUnitPK = Annotated[int, "ReservationUnit PK"]
SpacePK = Annotated[int, "Space PK"]
ResourcePK = Annotated[int, "Resource PK"]


@dataclass
class ReservationUnitInfo:
    pk: ReservationUnitPK
    space_ids: set[SpacePK]
    resource_ids: set[ResourcePK]

    def __init__(self, reservation_unit_values: dict[str, Any]):
        self.pk = reservation_unit_values["pk"]
        self.space_ids = set(reservation_unit_values["space_ids"])
        self.resource_ids = set(reservation_unit_values["resource_ids"])


@dataclass
class ReservationInfo:
    time_span: TimeSpanElement
    reservation_unit_id: ReservationUnitPK
    space_ids: set[SpacePK]
    resource_ids: set[ResourcePK]

    def __init__(self, reservation_values: dict[str, Any]):
        self.time_span = TimeSpanElement(
            start_datetime=reservation_values["begin"],
            end_datetime=reservation_values["end"],
            is_reservable=False,
            buffer_time_before=reservation_values["buffer_time_before"],
            buffer_time_after=reservation_values["buffer_time_after"],
        )
        self.reservation_unit_id = reservation_values["reservation_unit__id"]
        self.space_ids = set(reservation_values["space_ids"])
        self.resource_ids = set(reservation_values["resource_ids"])


class ReservationQuerySet(QuerySet):
    def get_affecting_reservations_as_closed_time_spans(
        self,
        reservation_unit_queryset: ReservationUnitQuerySet,
        start_date: date,
        end_date: date,
    ) -> dict[ReservationUnitPK, set[TimeSpanElement]]:
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
            )
        )
        reservation_infos = [ReservationInfo(item) for item in reservation_queryset]

        closed_time_spans: dict[ReservationUnitPK, set[TimeSpanElement]] = {}

        for reservation_info in reservation_infos:
            # Still add this reservation for the reservation unit if it doesn't have any spaces or resources.
            if not reservation_info.space_ids and not reservation_info.resource_ids:
                closed_time_spans.setdefault(reservation_info.reservation_unit_id, set())
                closed_time_spans[reservation_info.reservation_unit_id].add(reservation_info.time_span)
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
                        closed_time_spans.setdefault(reservation_unit_info.pk, set())
                        closed_time_spans[reservation_unit_info.pk].add(reservation_info.time_span)

            # Resources
            for reservation_unit_info in reservation_unit_infos:
                if reservation_unit_info.resource_ids.intersection(reservation_info.resource_ids):
                    closed_time_spans.setdefault(reservation_unit_info.pk, set())
                    closed_time_spans[reservation_unit_info.pk].add(reservation_info.time_span)

        return closed_time_spans

    def with_buffered_begin_and_end(self: Self) -> Self:
        """Annotate the queryset with buffered begin and end times."""
        return self.annotate(
            buffered_begin=F("begin") - Coalesce("buffer_time_before", timedelta(), output_field=DurationField()),
            buffered_end=F("end") + Coalesce("buffer_time_after", timedelta(), output_field=DurationField()),
        )

    def filter_buffered_reservations_period(self: Self, start_date: date, end_date: date) -> Self:
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

    def total_duration(self: Self) -> timedelta:
        return (
            self.annotate(duration=F("end") - F("begin"))
            .aggregate(total_duration=Sum("duration"))
            .get("total_duration")
        ) or timedelta()

    def total_seconds(self: Self) -> int:
        return int(self.total_duration().total_seconds())

    def within_application_round_period(self: Self, app_round: ApplicationRound) -> Self:
        return self.within_period(
            app_round.reservation_period_begin,
            app_round.reservation_period_end,
        )

    def within_period(self: Self, period_start: date, period_end: date) -> Self:
        return self.filter(
            begin__gte=period_start,
            end__lte=period_end,
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
        return self.going_to_occur().filter(end__gte=local_datetime())

    def inactive(self: Self, older_than_minutes: int) -> Self:
        return self.filter(
            state=ReservationStateChoice.CREATED,
            created_at__lte=local_datetime() - timedelta(minutes=older_than_minutes),
        )

    def with_same_components(
        self: Self,
        reservation_unit: ReservationUnit,
        begin: datetime | None,
        end: datetime | None,
    ) -> Self:
        if begin and end:
            return self.filter(
                reservation_unit__in=reservation_unit.actions.reservation_units_with_common_hierarchy,
                end__lte=end,
                begin__gte=begin,
            ).exclude(state__in=[ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])
        return self.none()

    def with_inactive_payments(self: Self, older_than_minutes: int) -> Self:
        return self.filter(
            state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            payment_order__remote_id__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__created_at__lte=local_datetime() - timedelta(minutes=older_than_minutes),
        )


class ReservationManager(SerializableMixin.SerializableManager, Manager.from_queryset(ReservationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""
