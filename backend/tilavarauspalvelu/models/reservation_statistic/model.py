from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import MunicipalityChoice, ReservationCancelReasonChoice, ReserveeType
from utils.date_utils import DEFAULT_TIMEZONE, datetime_difference

if TYPE_CHECKING:
    from decimal import Decimal

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import Reservation

    from .actions import ReservationStatisticActions
    from .queryset import ReservationStatisticManager
    from .validators import ReservationStatisticValidator


class ReservationStatistic(models.Model):
    # Link to the reservation

    reservation = models.OneToOneField(
        "tilavarauspalvelu.Reservation",
        related_name="reservation_statistic",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    # Copied from Reservation

    num_persons: int | None = models.PositiveIntegerField(null=True, blank=True)  # type: ignore[assignment]
    state: str = models.CharField(max_length=255)  # type: ignore[assignment]
    reservation_type: str | None = models.CharField(max_length=255, null=True, blank=True)  # type: ignore[assignment]  # noqa: DJ001

    begin: datetime.datetime = models.DateTimeField()  # type: ignore[assignment]
    end: datetime.datetime = models.DateTimeField()  # type: ignore[assignment]
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)  # type: ignore[assignment]
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)  # type: ignore[assignment]
    reservation_handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)  # type: ignore[assignment]
    reservation_confirmed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)  # type: ignore[assignment]
    reservation_created_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, default=timezone.now)  # type: ignore[assignment]  # noqa: TID251

    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # type: ignore[assignment]
    price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)  # type: ignore[assignment]
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)  # type: ignore[assignment]
    non_subsidised_price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)  # type: ignore[assignment]
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)  # type: ignore[assignment]

    applying_for_free_of_charge: bool = models.BooleanField(default=False, blank=True)  # type: ignore[assignment]

    reservee_id: str = models.CharField(max_length=255, blank=True, default="")  # type: ignore[assignment]
    reservee_organisation_name: str = models.CharField(max_length=255, blank=True, default="")  # type: ignore[assignment]
    reservee_address_zip: str = models.CharField(max_length=255, blank=True, default="")  # type: ignore[assignment]
    reservee_is_unregistered_association: bool = models.BooleanField(null=True, default=False, blank=True)  # type: ignore[assignment]
    reservee_language: str = models.CharField(max_length=255, blank=True, default="")  # type: ignore[assignment]
    reservee_type: str | None = models.CharField(max_length=255, null=True, blank=True)  # type: ignore[assignment]  # noqa: DJ001

    # Access type information

    access_type: str = models.CharField(max_length=255)  # type: ignore[assignment]
    access_code_generated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)  # type: ignore[assignment]

    # Static copies of values from other related models

    primary_reservation_unit: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    primary_reservation_unit_name: str = models.CharField(max_length=255)  # type: ignore[assignment]
    primary_unit_tprek_id: str | None = models.CharField(max_length=255, null=True, blank=True)  # type: ignore[assignment]  # noqa: DJ001
    primary_unit_name: str = models.CharField(max_length=255)  # type: ignore[assignment]

    deny_reason: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    deny_reason_text: str = models.CharField(max_length=255)  # type: ignore[assignment]

    cancel_reason: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    cancel_reason_text: str = models.CharField(max_length=255)  # type: ignore[assignment]

    purpose: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    purpose_name: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]

    home_city: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    home_city_name: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]
    home_city_municipality_code: str = models.CharField(max_length=255, default="")  # type: ignore[assignment]

    age_group: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    age_group_name: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]

    # Removed from series model
    ability_group: int | None = models.BigIntegerField(null=True, blank=True)  # type: ignore[assignment]
    ability_group_name: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]

    # Reservation statistics specific

    updated_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, auto_now=True)  # type: ignore[assignment]
    priority: int | None = models.IntegerField(null=True, blank=True)  # type: ignore[assignment]
    priority_name: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]
    duration_minutes: int = models.IntegerField()  # type: ignore[assignment]
    is_subsidised: bool = models.BooleanField(default=False)  # type: ignore[assignment]
    is_recurring: bool = models.BooleanField(default=False)  # type: ignore[assignment]
    recurrence_begin_date: datetime.date | None = models.DateField(null=True, blank=True)  # type: ignore[assignment]
    recurrence_end_date: datetime.date | None = models.DateField(null=True, blank=True)  # type: ignore[assignment]
    recurrence_uuid: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]
    reservation_uuid: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]
    reservee_uuid: str = models.CharField(max_length=255, default="", blank=True)  # type: ignore[assignment]
    reservee_used_ad_login: bool = models.BooleanField(default=False, blank=True)  # type: ignore[assignment]
    is_applied: bool = models.BooleanField(default=False, blank=True)  # type: ignore[assignment]
    """Is the reservation done through application process."""

    objects: ClassVar[ReservationStatisticManager] = LazyModelManager.new()
    actions: LazyAttribute[ReservationStatisticActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationStatisticValidator] = LazyModelAttribute.new()

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
        from tilavarauspalvelu.translation import translated

        reservation_series = getattr(reservation, "reservation_series", None)
        allocated_time_slot = getattr(reservation_series, "allocated_time_slot", None)
        age_group = getattr(reservation, "age_group", None)
        deny_reason = getattr(reservation, "deny_reason", None)
        user = getattr(reservation, "user", None)
        purpose = getattr(reservation, "purpose", None)

        cancel_reason: ReservationCancelReasonChoice | None = None
        if reservation.cancel_reason is not None:
            cancel_reason = ReservationCancelReasonChoice(reservation.cancel_reason)

        requires_org_data = reservation.reservee_type != ReserveeType.INDIVIDUAL
        by_profile_user = bool(reservation.user.profile_id)
        begin = reservation.begins_at.astimezone(DEFAULT_TIMEZONE)
        end = reservation.ends_at.astimezone(DEFAULT_TIMEZONE)
        duration = datetime_difference(start_datetime=begin, end_datetime=end)

        # Don't care about existing statistics, we can use `bulk_create` with `update_conflicts=True`
        # to upsert the statistic based on which reservation it belongs to.
        statistic = ReservationStatistic(reservation=reservation)

        statistic.access_code_generated_at = reservation.access_code_generated_at
        statistic.access_type = reservation.access_type
        statistic.age_group = getattr(age_group, "id", None)
        statistic.age_group_name = str(age_group) if age_group is not None else ""
        statistic.applying_for_free_of_charge = reservation.applying_for_free_of_charge
        statistic.begin = begin
        statistic.buffer_time_after = reservation.buffer_time_after
        statistic.buffer_time_before = reservation.buffer_time_before
        statistic.cancel_reason_text = translated(cancel_reason.label, "fi") if cancel_reason is not None else ""
        statistic.deny_reason = getattr(deny_reason, "id", None)
        statistic.deny_reason_text = getattr(deny_reason, "reason", "")
        statistic.duration_minutes = int(duration.total_seconds() / 60)
        statistic.end = end
        statistic.is_applied = allocated_time_slot is not None
        statistic.is_recurring = reservation_series is not None
        statistic.is_subsidised = reservation.price < reservation.non_subsidised_price
        statistic.non_subsidised_price = reservation.non_subsidised_price
        statistic.non_subsidised_price_net = reservation.non_subsidised_price_net
        statistic.num_persons = reservation.num_persons
        statistic.price = reservation.price
        statistic.price_net = reservation.price_net
        statistic.purpose = getattr(purpose, "id", None)
        statistic.purpose_name = getattr(purpose, "name", "")
        statistic.recurrence_begin_date = getattr(reservation_series, "begin_date", None)
        statistic.recurrence_end_date = getattr(reservation_series, "end_date", None)
        statistic.recurrence_uuid = str(getattr(reservation_series, "ext_uuid", ""))
        statistic.reservation = reservation
        statistic.reservation_confirmed_at = reservation.confirmed_at
        statistic.reservation_created_at = reservation.created_at
        statistic.reservation_handled_at = reservation.handled_at
        statistic.reservation_type = reservation.type
        statistic.reservation_uuid = str(reservation.ext_uuid)
        statistic.reservee_address_zip = reservation.reservee_address_zip if by_profile_user else ""
        statistic.reservee_id = reservation.reservee_identifier if requires_org_data else ""
        statistic.reservee_is_unregistered_association = not reservation.reservee_identifier
        statistic.reservee_language = user.get_preferred_language() if user else ""
        statistic.reservee_organisation_name = reservation.reservee_organisation_name if requires_org_data else ""
        statistic.reservee_type = str(reservation.reservee_type)
        statistic.reservee_used_ad_login = reservation.reservee_used_ad_login
        statistic.reservee_uuid = str(getattr(user, "tvp_uuid", ""))
        statistic.state = reservation.state
        statistic.tax_percentage_value = reservation.tax_percentage_value

        if reservation.municipality is not None:
            municipality = MunicipalityChoice(reservation.municipality)
            statistic.home_city_municipality_code = municipality.code
            statistic.home_city_name = str(municipality.value)

        statistic.primary_reservation_unit = reservation.reservation_unit.id
        statistic.primary_reservation_unit_name = reservation.reservation_unit.name
        statistic.primary_unit_name = getattr(reservation.reservation_unit.unit, "name", "")
        statistic.primary_unit_tprek_id = getattr(reservation.reservation_unit.unit, "tprek_id", "")

        if save:
            statistic.save()

        return statistic
