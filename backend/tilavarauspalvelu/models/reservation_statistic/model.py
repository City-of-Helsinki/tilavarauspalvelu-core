from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import CustomerTypeChoice
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.models import Reservation

    from .actions import ReservationStatisticActions
    from .queryset import ReservationStatisticManager
    from .validators import ReservationStatisticValidator


class ReservationStatistic(models.Model):
    # Copied from Reservation

    num_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    state: str = models.CharField(max_length=255)
    reservation_type: str | None = models.CharField(max_length=255, null=True)

    begin: datetime.datetime = models.DateTimeField()
    end: datetime.datetime = models.DateTimeField()
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    reservation_handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    reservation_confirmed_at: datetime.datetime | None = models.DateTimeField(null=True)
    reservation_created_at: datetime.datetime | None = models.DateTimeField(null=True, default=timezone.now)  # noqa: TID251

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

    # Access type information
    access_type: str = models.CharField(max_length=255)
    access_code_generated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    # Relations and static copies of their values

    primary_reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="reservation_statistics",
        null=True,
        on_delete=models.SET_NULL,
    )
    primary_reservation_unit_name: str = models.CharField(max_length=255)
    primary_unit_tprek_id: str | None = models.CharField(max_length=255, null=True)
    primary_unit_name: str = models.CharField(max_length=255)

    deny_reason = models.ForeignKey(
        "tilavarauspalvelu.ReservationDenyReason",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    deny_reason_text: str = models.CharField(max_length=255)

    cancel_reason = models.ForeignKey(
        "tilavarauspalvelu.ReservationCancelReason",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    cancel_reason_text: str = models.CharField(max_length=255)

    purpose = models.ForeignKey(
        "tilavarauspalvelu.ReservationPurpose",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    purpose_name: str = models.CharField(max_length=255, default="", blank=True)

    home_city = models.ForeignKey(
        "tilavarauspalvelu.City",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    home_city_name: str = models.CharField(max_length=255, default="", blank=True)
    home_city_municipality_code: str = models.CharField(max_length=255, default="")

    age_group = models.ForeignKey(
        "tilavarauspalvelu.AgeGroup",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group_name: str = models.CharField(max_length=255, default="", blank=True)

    # From RecurringReservation
    ability_group = models.ForeignKey(
        "tilavarauspalvelu.AbilityGroup",
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    ability_group_name: str = models.TextField()

    reservation = models.OneToOneField(
        "tilavarauspalvelu.Reservation",
        related_name="reservation_statistic",
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
    reservation_uuid: str = models.CharField(max_length=255, default="", blank=True)
    reservee_uuid: str = models.CharField(max_length=255, default="", blank=True)
    reservee_used_ad_login: bool = models.BooleanField(default=False, blank=True)
    is_applied: bool = models.BooleanField(default=False, blank=True)
    """Is the reservation done through application process."""

    objects: ClassVar[ReservationStatisticManager] = LazyModelManager.new()
    actions: ReservationStatisticActions = LazyModelAttribute.new()
    validators: ReservationStatisticValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_statistic"
        base_manager_name = "objects"
        verbose_name = _("reservation statistic")
        verbose_name_plural = _("reservation statistics")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.reservee_uuid} - {self.begin} - {self.end}"

    @classmethod
    def for_reservation(cls, reservation: Reservation, *, save: bool = False) -> ReservationStatistic:  # noqa: PLR0915
        recurring_reservation = getattr(reservation, "recurring_reservation", None)
        ability_group = getattr(recurring_reservation, "ability_group", None)
        allocated_time_slot = getattr(recurring_reservation, "allocated_time_slot", None)

        requires_org_name = reservation.reservee_type != CustomerTypeChoice.INDIVIDUAL
        requires_org_id = not reservation.reservee_is_unregistered_association and requires_org_name
        by_profile_user = bool(getattr(reservation.user, "profile_id", ""))

        # Don't care about existing statistics, we can use `bulk_create` with `update_conflicts=True`
        # to upsert the statistic based on which reservation it belongs to.
        statistic = ReservationStatistic(reservation=reservation)

        statistic.ability_group = ability_group
        statistic.access_code_generated_at = reservation.access_code_generated_at
        statistic.access_type = reservation.access_type
        statistic.age_group = reservation.age_group
        statistic.age_group_name = str(reservation.age_group)
        statistic.applying_for_free_of_charge = reservation.applying_for_free_of_charge
        statistic.begin = reservation.begin
        statistic.buffer_time_after = reservation.buffer_time_after
        statistic.buffer_time_before = reservation.buffer_time_before
        statistic.cancel_reason = reservation.cancel_reason
        statistic.cancel_reason_text = getattr(reservation.cancel_reason, "reason", "")
        statistic.deny_reason = reservation.deny_reason
        statistic.deny_reason_text = getattr(reservation.deny_reason, "reason", "")
        statistic.duration_minutes = (reservation.end - reservation.begin).total_seconds() / 60
        statistic.end = reservation.end
        statistic.home_city = reservation.home_city
        statistic.home_city_municipality_code = getattr(reservation.home_city, "municipality_code", "")
        statistic.home_city_name = reservation.home_city.name if reservation.home_city else ""
        statistic.is_applied = allocated_time_slot is not None
        statistic.is_recurring = recurring_reservation is not None
        statistic.is_subsidised = reservation.price < reservation.non_subsidised_price
        statistic.non_subsidised_price = reservation.non_subsidised_price
        statistic.non_subsidised_price_net = reservation.non_subsidised_price_net
        statistic.num_persons = reservation.num_persons
        statistic.price = reservation.price
        statistic.price_net = reservation.price_net
        statistic.purpose = reservation.purpose
        statistic.purpose_name = reservation.purpose.name if reservation.purpose else ""
        statistic.recurrence_begin_date = getattr(recurring_reservation, "begin_date", None)
        statistic.recurrence_end_date = getattr(recurring_reservation, "end_date", None)
        statistic.recurrence_uuid = str(getattr(recurring_reservation, "ext_uuid", ""))
        statistic.reservation = reservation
        statistic.reservation_confirmed_at = reservation.confirmed_at
        statistic.reservation_created_at = reservation.created_at
        statistic.reservation_handled_at = reservation.handled_at
        statistic.reservation_type = reservation.type
        statistic.reservation_uuid = str(reservation.ext_uuid)
        statistic.reservee_address_zip = reservation.reservee_address_zip if by_profile_user else ""
        statistic.reservee_id = reservation.reservee_id if requires_org_id else ""
        statistic.reservee_is_unregistered_association = reservation.reservee_is_unregistered_association
        statistic.reservee_language = reservation.user.get_preferred_language()
        statistic.reservee_organisation_name = reservation.reservee_organisation_name if requires_org_name else ""
        statistic.reservee_type = reservation.reservee_type
        statistic.reservee_used_ad_login = reservation.reservee_used_ad_login
        statistic.reservee_uuid = str(reservation.user.tvp_uuid) if reservation.user else ""
        statistic.state = reservation.state
        statistic.tax_percentage_value = reservation.tax_percentage_value

        for res_unit in reservation.reservation_units.all():
            statistic.primary_reservation_unit = res_unit
            statistic.primary_reservation_unit_name = res_unit.name
            statistic.primary_unit_name = getattr(res_unit.unit, "name", "")
            statistic.primary_unit_tprek_id = getattr(res_unit.unit, "tprek_id", "")
            break

        if statistic.is_applied and ability_group:
            statistic.ability_group_name = ability_group.name

        if save:
            statistic.save()

        return statistic
