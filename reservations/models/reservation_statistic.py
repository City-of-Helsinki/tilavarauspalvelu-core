import datetime

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from applications.choices import PriorityChoice
from reservations.choices import CustomerTypeChoice

__all__ = [
    "ReservationStatistic",
    "ReservationStatisticsReservationUnit",
]


class ReservationStatistic(models.Model):
    reservation = models.OneToOneField("reservations.Reservation", on_delete=models.SET_NULL, null=True)

    reservation_created_at = models.DateTimeField(verbose_name=_("Created at"), null=True, default=timezone.now)

    reservation_handled_at = models.DateTimeField(
        verbose_name=_("Handled at"),
        null=True,
        blank=True,
        help_text="When this reservation was handled.",
    )

    reservation_confirmed_at = models.DateTimeField(verbose_name=_("Confirmed at"), null=True)

    buffer_time_before: datetime.timedelta = models.DurationField(
        verbose_name=_("Buffer time before"),
        default=datetime.timedelta(),
        blank=True,
    )
    buffer_time_after: datetime.timedelta = models.DurationField(
        verbose_name=_("Buffer time after"),
        default=datetime.timedelta(),
        blank=True,
    )

    updated_at = models.DateTimeField(verbose_name=_("Statistics updated at"), null=True, blank=True, auto_now=True)

    reservee_type = models.CharField(
        max_length=50,
        choices=CustomerTypeChoice.choices,
        null=True,
        blank=True,
        help_text="Type of reservee",
    )

    applying_for_free_of_charge = models.BooleanField(
        verbose_name=_("Reservee is applying for a free-of-charge reservation"),
        null=False,
        default=False,
        blank=True,
    )

    reservee_language = models.CharField(
        verbose_name=_("Preferred language of reservee"),
        max_length=255,
        blank=True,
        default="",
    )

    num_persons = models.fields.PositiveIntegerField(verbose_name=_("Number of persons"), null=True, blank=True)

    priority = models.IntegerField(choices=PriorityChoice.choices, default=PriorityChoice.MEDIUM)

    priority_name = models.CharField(max_length=255, null=False, default="", blank=True)

    home_city = models.ForeignKey(
        "applications.City",
        verbose_name=_("Home city"),
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Home city of the group or association",
    )

    home_city_name = models.CharField(
        verbose_name=_("Home city name"),
        max_length=100,
        null=False,
        default="",
        blank=True,
    )

    home_city_municipality_code = models.CharField(
        verbose_name=_("Home city municipality code"), default="", max_length=30
    )

    purpose = models.ForeignKey(
        "ReservationPurpose",
        verbose_name=_("Reservation purpose"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    purpose_name = models.CharField(max_length=200, null=False, default="", blank=True)

    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        verbose_name=_("Age group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    age_group_name = models.fields.CharField(max_length=255, null=False, default="", blank=True)

    is_applied = models.BooleanField(
        default=False,
        blank=True,
        verbose_name=_("Is the reservation done through application process."),
    )

    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        verbose_name=_("Ability group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    ability_group_name = models.fields.TextField(
        verbose_name=_("Name"),
        null=False,
        blank=False,
    )

    begin = models.DateTimeField(verbose_name=_("Begin time"))

    end = models.DateTimeField(verbose_name=_("End time"))

    duration_minutes = models.IntegerField(null=False, verbose_name=_("Reservation duration in minutes"))

    reservation_type = models.CharField(
        max_length=50,
        null=True,
        blank=False,
        help_text="Type of reservation",
    )

    state = models.CharField(
        max_length=32,
        verbose_name=_("State"),
    )

    cancel_reason = models.ForeignKey(
        "reservations.ReservationCancelReason",
        verbose_name=_("Reason for cancellation"),
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    cancel_reason_text = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        verbose_name=_("The reason text of the cancel reason"),
    )

    deny_reason = models.ForeignKey(
        "reservations.ReservationDenyReason",
        verbose_name=_("Reason for deny"),
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    deny_reason_text = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        verbose_name=_("The reason text of the deny reason"),
    )

    price = models.DecimalField(
        verbose_name=_("Price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="The price of this particular reservation",
    )

    price_net = models.DecimalField(
        verbose_name=_("Price net"),
        max_digits=20,
        decimal_places=6,
        default=0,
        help_text="The price of this particular reservation excluding VAT",
    )

    non_subsidised_price = models.DecimalField(
        verbose_name=_("Non subsidised price"),
        max_digits=20,
        decimal_places=2,
        default=0,
        help_text="The non subsidised price of the reservation excluding VAT",
    )
    non_subsidised_price_net = models.DecimalField(
        verbose_name=_("Non subsidised net price"),
        max_digits=20,
        decimal_places=6,
        default=0,
        help_text="The non subsidised price of the reservation excluding VAT",
    )
    is_subsidised = models.BooleanField(help_text="Is the reservation price subsidised", default=False)
    is_recurring = models.BooleanField(help_text="Is the reservation recurring", default=False)
    recurrence_begin_date = models.DateField(verbose_name="Recurrence begin date", null=True)
    recurrence_end_date = models.DateField(verbose_name="Recurrence end date", null=True)
    recurrence_uuid = models.CharField(verbose_name="Recurrence UUID", max_length=255, default="", blank=True)
    reservee_is_unregistered_association = models.BooleanField(
        verbose_name=_("Reservee is an unregistered association"),
        null=True,
        default=False,
        blank=True,
    )
    reservee_uuid = models.CharField(verbose_name="Reservee UUID", max_length=255, default="", blank=True)
    tax_percentage_value = models.DecimalField(
        verbose_name=_("Tax percentage value"),
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="The value of the tax percentage for this particular reservation",
    )

    primary_reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit", null=True, on_delete=models.SET_NULL
    )

    primary_reservation_unit_name = models.CharField(verbose_name=_("Name"), max_length=255)
    primary_unit_tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
        max_length=255,
        null=True,
    )
    primary_unit_name = models.CharField(verbose_name=_("Name"), max_length=255)

    class Meta:
        db_table = "reservation_statistic"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.reservee_uuid} - {self.begin} - {self.end}"


class ReservationStatisticsReservationUnit(models.Model):
    reservation_statistics = models.ForeignKey(
        "reservations.ReservationStatistic",
        on_delete=models.CASCADE,
        related_name="reservation_stats_reservation_units",
    )
    reservation_unit = models.ForeignKey("reservation_units.ReservationUnit", null=True, on_delete=models.SET_NULL)
    unit_tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
        max_length=255,
        null=True,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    unit_name = models.CharField(verbose_name=_("Name"), max_length=255)

    class Meta:
        db_table = "reservation_statistics_reservation_unit"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.reservation_statistics} - {self.reservation_unit}"
