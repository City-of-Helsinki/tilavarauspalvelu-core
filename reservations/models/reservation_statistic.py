import datetime
from decimal import Decimal

from django.db import models
from django.utils import timezone

__all__ = [
    "ReservationStatistic",
    "ReservationStatisticsReservationUnit",
]


class ReservationStatistic(models.Model):
    # Copied from Reservation

    num_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)
    state: str = models.CharField(max_length=255)
    reservation_type: str | None = models.CharField(max_length=255, null=True)

    begin: datetime.datetime = models.DateTimeField()
    end: datetime.datetime = models.DateTimeField()
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    reservation_handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    reservation_confirmed_at: datetime.datetime | None = models.DateTimeField(null=True)
    reservation_created_at: datetime.datetime | None = models.DateTimeField(null=True, default=timezone.now)

    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    non_subsidised_price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    applying_for_free_of_charge: bool = models.BooleanField(default=False, blank=True)

    reservee_id: str = models.CharField(max_length=255, blank=True, default="")
    reservee_organisation_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_zip: str = models.CharField(max_length=255, blank=True, default="")
    reservee_is_unregistered_association: bool = models.BooleanField(null=True, default=False, blank=True)
    reservee_language: str = models.CharField(max_length=255, blank=True, default="")
    reservee_type: str | None = models.CharField(max_length=255, null=True, blank=True)

    # Relations and static copies of their values

    primary_reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        null=True,
        on_delete=models.SET_NULL,
    )
    primary_reservation_unit_name: str = models.CharField(max_length=255)
    primary_unit_tprek_id: str | None = models.CharField(max_length=255, null=True)
    primary_unit_name: str = models.CharField(max_length=255)

    deny_reason = models.ForeignKey(
        "reservations.ReservationDenyReason",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    deny_reason_text: str = models.CharField(max_length=255)

    cancel_reason = models.ForeignKey(
        "reservations.ReservationCancelReason",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    cancel_reason_text: str = models.CharField(max_length=255)

    purpose = models.ForeignKey(
        "reservations.ReservationPurpose",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    purpose_name: str = models.CharField(max_length=255, default="", blank=True)

    home_city = models.ForeignKey(
        "applications.City",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    home_city_name: str = models.CharField(max_length=255, default="", blank=True)
    home_city_municipality_code: str = models.CharField(max_length=255, default="")

    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group_name: str = models.fields.CharField(max_length=255, default="", blank=True)

    # From RecurringReservation
    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    ability_group_name: str = models.fields.TextField()

    reservation = models.OneToOneField(
        "reservations.Reservation",
        on_delete=models.SET_NULL,
        null=True,
    )

    # Reservation statistics specific

    updated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, auto_now=True)
    priority: int | None = models.IntegerField(null=True, blank=True)
    priority_name: str = models.CharField(max_length=255, default="", blank=True)
    duration_minutes: int = models.IntegerField()
    is_subsidised: bool = models.BooleanField(default=False)
    is_recurring: bool = models.BooleanField(default=False)
    recurrence_begin_date: datetime.date | None = models.DateField(null=True)
    recurrence_end_date: datetime.date | None = models.DateField(null=True)
    recurrence_uuid: str = models.CharField(max_length=255, default="", blank=True)
    reservee_uuid: str = models.CharField(max_length=255, default="", blank=True)
    is_applied: bool = models.BooleanField(default=False, blank=True)
    """Is the reservation done through application process."""

    class Meta:
        db_table = "reservation_statistic"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"{self.reservee_uuid} - {self.begin} - {self.end}"


class ReservationStatisticsReservationUnit(models.Model):
    name = models.CharField(max_length=255)
    unit_name = models.CharField(max_length=255)
    unit_tprek_id = models.CharField(max_length=255, null=True)

    reservation_statistics = models.ForeignKey(
        "reservations.ReservationStatistic",
        on_delete=models.CASCADE,
        related_name="reservation_stats_reservation_units",
    )
    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        null=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        db_table = "reservation_statistics_reservation_unit"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"{self.reservation_statistics} - {self.reservation_unit}"
