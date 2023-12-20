from datetime import datetime, timedelta

from django.db import models
from django.db.models import F, Manager, Sum
from django.utils import timezone
from django.utils.timezone import get_current_timezone
from helsinki_gdpr.models import SerializableMixin

from applications.models import ApplicationRound
from merchants.models import OrderStatus
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice


class ReservationQuerySet(models.QuerySet):
    def total_duration(self) -> timedelta:
        return (
            self.annotate(duration=F("end") - F("begin"))
            .aggregate(total_duration=Sum("duration"))
            .get("total_duration")
        ) or timedelta()

    def total_seconds(self) -> int:
        return int(self.total_duration().total_seconds())

    def within_application_round_period(self, app_round: ApplicationRound):
        return self.within_period(
            app_round.reservation_period_begin,
            app_round.reservation_period_end,
        )

    def within_period(self, period_start, period_end):
        return self.filter(
            begin__gte=period_start,
            end__lte=period_end,
        )

    def going_to_occur(self):
        return self.filter(
            state__in=(
                ReservationStateChoice.CREATED,
                ReservationStateChoice.CONFIRMED,
                ReservationStateChoice.WAITING_FOR_PAYMENT,
                ReservationStateChoice.REQUIRES_HANDLING,
            )
        )

    def active(self):
        return self.going_to_occur().filter(end__gte=timezone.now())

    def inactive(self, older_than_minutes: int):
        return self.filter(
            state=ReservationStateChoice.CREATED,
            created_at__lte=datetime.now(tz=get_current_timezone()) - timedelta(minutes=older_than_minutes),
        )

    def with_same_components(self, reservation_unit: ReservationUnit, begin: datetime | None, end: datetime | None):
        if begin and end:
            return self.filter(
                reservation_unit__in=reservation_unit.reservation_units_with_same_components,
                end__lte=end,
                begin__gte=begin,
            ).exclude(state__in=[ReservationStateChoice.CANCELLED, ReservationStateChoice.DENIED])
        return self.none()

    def with_inactive_payments(self, older_than_minutes: int):
        return self.filter(
            state=ReservationStateChoice.WAITING_FOR_PAYMENT,
            payment_order__remote_id__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__created_at__lte=datetime.now(tz=get_current_timezone())
            - timedelta(minutes=older_than_minutes),
        )


class ReservationManager(SerializableMixin.SerializableManager, Manager.from_queryset(ReservationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""
