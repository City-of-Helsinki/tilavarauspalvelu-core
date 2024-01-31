import datetime
from decimal import Decimal

from django.db import models
from django.utils import timezone

__all__ = [
    "ReservationStatistic",
    "ReservationStatisticsReservationUnit",
]


class ReservationStatistic(models.Model):
    num_persons: int | None = models.PositiveIntegerField(null=True, blank=True)

    priority: int = models.IntegerField()  # no enum (old statuses)
    reservation_type: str = models.CharField(max_length=255, null=True)  # no enum (old statuses)
    state: str = models.CharField(max_length=255)  # no enum (old statuses)

    begin: datetime.datetime = models.DateTimeField()
    end: datetime.datetime = models.DateTimeField()
    buffer_time_before: datetime.timedelta | None = models.DurationField(blank=True, null=True)
    buffer_time_after: datetime.timedelta | None = models.DurationField(blank=True, null=True)
    reservation_created_at: datetime.timedelta | None = models.DateTimeField(null=True, default=timezone.now)
    reservation_handled_at: datetime.timedelta | None = models.DateTimeField(null=True, blank=True)
    reservation_confirmed_at = models.DateTimeField(null=True)

    duration_minutes: int = models.IntegerField()

    updated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, auto_now=True)

    reservee_type: str | None = models.CharField(max_length=255, null=True, blank=True)  # no enum (old statuses)
    reservee_uuid: str = models.CharField(max_length=255, blank=True, default="")
    reservee_is_unregistered_association: bool | None = models.BooleanField(null=True, default=False, blank=True)
    reservee_language: str | None = models.CharField(max_length=255, null=True, blank=True)  # no enum (old statuses)

    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    non_subsidised_price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    applying_for_free_of_charge: bool = models.BooleanField(default=False, blank=True)

    deny_reason_text: str = models.CharField(max_length=255)
    cancel_reason_text: str = models.CharField(max_length=255)

    is_applied: bool = models.BooleanField(default=False, blank=True)  # gone through the application process
    is_recurring: bool = models.BooleanField(default=False, blank=True)
    is_subsidised: bool = models.BooleanField(default=False, blank=True)

    ability_group_name: str = models.fields.TextField()
    age_group_name: str = models.fields.CharField(max_length=255, default="", blank=True)
    home_city_municipality_code: str = models.CharField(default="", max_length=30)
    home_city_name: str = models.CharField(max_length=100, default="", blank=True)
    primary_reservation_unit_name: str = models.CharField(max_length=255)
    primary_unit_name: str = models.CharField(max_length=255)
    primary_unit_tprek_id: str | None = models.CharField(max_length=255, null=True)
    priority_name: str = models.CharField(max_length=255, default="", blank=True)
    purpose_name: str = models.CharField(max_length=200, default="", blank=True)

    recurrence_begin_date: datetime.date | None = models.DateField(null=True)
    recurrence_end_date: datetime.date | None = models.DateField(null=True)
    recurrence_uuid: str = models.CharField(max_length=255, default="", blank=True)

    # Relations
    reservation = models.OneToOneField(
        "reservations.Reservation",
        on_delete=models.SET_NULL,
        null=True,
        related_name="reservation_statistic",
    )
    primary_reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    home_city = models.ForeignKey(
        "applications.City",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    purpose = models.ForeignKey(
        "reservations.ReservationPurpose",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    cancel_reason = models.ForeignKey(
        "reservations.ReservationCancelReason",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )
    deny_reason = models.ForeignKey(
        "reservations.ReservationDenyReason",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservation_statistics",
    )

    class Meta:
        db_table = "reservation_statistic"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.reservee_uuid} - {self.begin} - {self.end}"


class ReservationStatisticsReservationUnit(models.Model):
    name: str = models.CharField(max_length=255)
    unit_tprek_id: str | None = models.CharField(max_length=255, null=True)
    unit_name: str = models.CharField(max_length=255)

    reservation_statistics = models.ForeignKey(
        ReservationStatistic,
        on_delete=models.CASCADE,
        related_name="reservation_stats_reservation_units",
    )
    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        null=True,
        on_delete=models.SET_NULL,
        related_name="reservation_stats_reservation_units",
    )

    class Meta:
        db_table = "reservation_statistics_reservation_unit"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.reservation_statistics} - {self.reservation_unit}"
