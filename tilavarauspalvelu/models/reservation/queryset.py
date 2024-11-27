from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Self

from django.conf import settings
from django.contrib.postgres.aggregates import ArrayAgg
from django.db import models
from django.db.models.functions import Coalesce
from helsinki_gdpr.models import SerializableMixin

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice, ReservationTypeChoice
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, Reservation, ReservationUnit
    from tilavarauspalvelu.typing import AnyUser


__all__ = [
    "ReservationManager",
    "ReservationQuerySet",
]


class ReservationQuerySet(models.QuerySet):
    def with_buffered_begin_and_end(self) -> Self:
        """Annotate the queryset with buffered begin and end times."""
        return self.annotate(
            buffered_begin=models.F("begin") - models.F("buffer_time_before"),
            buffered_end=models.F("end") + models.F("buffer_time_after"),
        )

    def filter_buffered_reservations_period(self, start_date: datetime.date, end_date: datetime.date) -> Self:
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

    def total_duration(self) -> datetime.timedelta:
        return (
            self.annotate(duration=models.F("end") - models.F("begin"))
            .aggregate(total_duration=models.Sum("duration"))
            .get("total_duration")
        ) or datetime.timedelta()

    def total_seconds(self) -> int:
        return int(self.total_duration().total_seconds())

    def within_application_round_period(self, app_round: ApplicationRound) -> Self:
        return self.within_period(
            app_round.reservation_period_begin,
            app_round.reservation_period_end,
        )

    def within_period(self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservation fully withing a period."""
        return self.filter(
            begin__date__gte=period_start,
            end__date__lte=period_end,
        )

    def overlapping_period(self, period_start: datetime.date, period_end: datetime.date) -> Self:
        """All reservations that overlap with a period, even partially."""
        return self.filter(
            begin__date__lte=period_end,
            end__date__gte=period_start,
        )

    def going_to_occur(self) -> Self:
        return self.filter(state__in=ReservationStateChoice.states_going_to_occur)

    def active(self) -> Self:
        """
        Filter reservations that have not ended yet.

        Note:
        - There might be older reservations with buffers that are still active,
          even if the reservation itself is not returned by this queryset.
        - Returned data may contain some 'Inactive' reservations, before they are deleted by a periodic task.
        """
        return self.going_to_occur().filter(end__gte=local_datetime())

    def inactive(self, older_than_minutes: int) -> Self:
        """Filter 'draft' reservations, which are older than X minutes old, and can be assumed to be inactive."""
        return self.filter(
            state=ReservationStateChoice.CREATED,
            created_at__lte=local_datetime() - datetime.timedelta(minutes=older_than_minutes),
        )

    def with_inactive_payments(self) -> Self:
        expiration_time = local_datetime() - datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
        return self.filter(
            state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            payment_order__remote_id__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__created_at__lte=expiration_time,
        )

    def affecting_reservations(self, units: list[int] = (), reservation_units: list[int] = ()) -> Self:
        """Filter reservations that affect other reservations in the given units and/or reservation units."""
        from tilavarauspalvelu.models import ReservationUnit

        qs = ReservationUnit.objects.all()
        if units:
            qs = qs.filter(unit__in=units)
        if reservation_units:
            qs = qs.filter(pk__in=reservation_units)

        return self.filter(
            reservation_units__in=models.Subquery(qs.affected_reservation_unit_ids),
        ).exclude(
            # Cancelled or denied reservations never affect any reservations
            state__in=[
                ReservationStateChoice.CANCELLED,
                ReservationStateChoice.DENIED,
            ]
        )

    def _fetch_all(self) -> None:
        super()._fetch_all()
        if "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self._hints:
            self._hints.pop("FETCH_UNITS_FOR_PERMISSIONS_FLAG", None)
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        self._hints["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = True
        return self

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.
        from tilavarauspalvelu.models import Unit

        items: list[Reservation] = list(self)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservation_units__reservations__in=items)
            .annotate(
                reservation_ids=Coalesce(
                    ArrayAgg(
                        "reservation_units__reservations",
                        distinct=True,
                        filter=(
                            models.Q(reservation_units__isnull=False)
                            & models.Q(reservation_units__reservations__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.reservation_ids]

    def filter_for_user_num_active_reservations(
        self,
        reservation_unit: ReservationUnit | models.OuterRef,
        user: AnyUser,
    ) -> Self:
        return self.active().filter(
            reservation_units=reservation_unit,
            user=user,
            type=ReservationTypeChoice.NORMAL.value,
        )


class ReservationManager(SerializableMixin.SerializableManager.from_queryset(ReservationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""
