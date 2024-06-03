from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Self

from django.conf import settings
from django.db import models
from helsinki_gdpr.models import SerializableMixin

from common.date_utils import local_datetime
from merchants.models import OrderStatus
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice

if TYPE_CHECKING:
    from applications.models import ApplicationRound


class ReservationQuerySet(models.QuerySet):
    def with_buffered_begin_and_end(self: Self) -> Self:
        """Annotate the queryset with buffered begin and end times."""
        return self.annotate(
            buffered_begin=models.F("begin") - models.F("buffer_time_before"),
            buffered_end=models.F("end") + models.F("buffer_time_after"),
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
            self.annotate(duration=models.F("end") - models.F("begin"))
            .aggregate(total_duration=models.Sum("duration"))
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
        return self.filter(state__in=ReservationStateChoice.states_going_to_occur)

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
            reservation_unit__in=models.Subquery(qs.affected_reservation_unit_ids),
        ).exclude(
            # Cancelled or denied reservations never affect any reservations
            state__in=[
                ReservationStateChoice.CANCELLED,
                ReservationStateChoice.DENIED,
            ]
        )


class ReservationManager(SerializableMixin.SerializableManager, models.Manager.from_queryset(ReservationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""
