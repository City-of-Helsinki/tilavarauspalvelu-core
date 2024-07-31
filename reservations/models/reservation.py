from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from django.db import models
from django.db.models.functions import Concat
from django.db.models.functions.text import Trim
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from lookup_property import lookup_property

from common.connectors import ReservationActionsConnector
from common.db import SubqueryArray
from reservations.enums import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.querysets import ReservationQuerySet
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    from decimal import Decimal

    from applications.models import City
    from reservations.models import (
        AgeGroup,
        RecurringReservation,
        ReservationCancelReason,
        ReservationDenyReason,
        ReservationPurpose,
    )
    from users.models import User


__all__ = [
    "Reservation",
]


class ReservationManager(SerializableMixin.SerializableManager, models.Manager.from_queryset(ReservationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""


class Reservation(SerializableMixin, models.Model):
    # Basic information
    sku: str = models.CharField(max_length=255, blank=True, default="")
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=255, blank=True, default="")
    num_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)
    state: str = models.CharField(
        max_length=32,
        choices=ReservationStateChoice.choices,
        default=ReservationStateChoice.CREATED,
        db_index=True,
    )
    type: str | None = models.CharField(
        max_length=50,
        null=True,
        blank=False,
        choices=ReservationTypeChoice.choices,
        default=ReservationTypeChoice.NORMAL,
    )
    cancel_details: str = models.TextField(blank=True, default="")
    handling_details: str = models.TextField(blank=True, default="")
    working_memo: str = models.TextField(null=True, blank=True, default="")

    # Time information
    begin: datetime.datetime = models.DateTimeField(db_index=True)
    end: datetime.datetime = models.DateTimeField(db_index=True)
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    confirmed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    created_at: datetime.datetime | None = models.DateTimeField(null=True, default=now)

    # Pricing details
    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    non_subsidised_price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)
    unit_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Free of charge information
    applying_for_free_of_charge: bool = models.BooleanField(null=False, default=False, blank=True)
    free_of_charge_reason: bool | None = models.TextField(null=True, blank=True)

    # Reservee information
    reservee_id: str = models.CharField(max_length=255, blank=True, default="")
    reservee_first_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_last_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_email: str | None = models.EmailField(null=True, blank=True)
    reservee_phone: str = models.CharField(max_length=255, blank=True, default="")
    reservee_organisation_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_street: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_city: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_zip: str = models.CharField(max_length=255, blank=True, default="")
    reservee_is_unregistered_association: bool = models.BooleanField(null=False, default=False, blank=True)
    reservee_language: str = models.CharField(
        max_length=255,
        blank=True,
        default="",
        choices=RESERVEE_LANGUAGE_CHOICES,
    )
    reservee_type: str | None = models.CharField(
        max_length=50,
        choices=CustomerTypeChoice.choices,
        null=True,
        blank=True,
    )

    # Billing information
    billing_first_name: str = models.CharField(max_length=255, blank=True, default="")
    billing_last_name: str = models.CharField(max_length=255, blank=True, default="")
    billing_email: str | None = models.EmailField(null=True, blank=True)
    billing_phone: str = models.CharField(max_length=255, blank=True, default="")
    billing_address_street: str = models.CharField(max_length=255, blank=True, default="")
    billing_address_city: str = models.CharField(max_length=255, blank=True, default="")
    billing_address_zip: str = models.CharField(max_length=255, blank=True, default="")

    # Relations
    reservation_unit = models.ManyToManyField("reservation_units.ReservationUnit")

    user: User | None = models.ForeignKey(
        "users.User",
        related_name="reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    recurring_reservation: RecurringReservation | None = models.ForeignKey(
        "reservations.RecurringReservation",
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    deny_reason: ReservationDenyReason | None = models.ForeignKey(
        "reservations.ReservationDenyReason",
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    cancel_reason: ReservationCancelReason | None = models.ForeignKey(
        "reservations.ReservationCancelReason",
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    purpose: ReservationPurpose | None = models.ForeignKey(
        "reservations.ReservationPurpose",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    home_city: City | None = models.ForeignKey(
        "applications.City",
        related_name="home_city_reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    age_group: AgeGroup | None = models.ForeignKey(
        "reservations.AgeGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    objects = ReservationManager()
    actions = ReservationActionsConnector()

    class Meta:
        db_table = "reservation"
        base_manager_name = "objects"
        ordering = [
            "begin",
        ]

    # For GDPR API
    serialize_fields = (
        {"name": "name"},
        {"name": "description"},
        {"name": "begin"},
        {"name": "end"},
        {"name": "reservee_first_name"},
        {"name": "reservee_last_name"},
        {"name": "reservee_email"},
        {"name": "reservee_phone"},
        {"name": "reservee_address_zip"},
        {"name": "reservee_address_city"},
        {"name": "reservee_address_street"},
        {"name": "billing_first_name"},
        {"name": "billing_last_name"},
        {"name": "billing_email"},
        {"name": "billing_phone"},
        {"name": "billing_address_zip"},
        {"name": "billing_address_city"},
        {"name": "billing_address_street"},
        {"name": "reservee_id"},
        {"name": "reservee_organisation_name"},
        {"name": "free_of_charge_reason"},
        {"name": "cancel_details"},
    )

    def __str__(self) -> str:
        return f"{self.name} ({self.type})"

    @lookup_property(joins=["recurring_reservation", "user"])
    def reservee_name() -> str:
        return models.Case(  # type: ignore[return-value]
            # Blocking reservation
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.BLOCKED.value)  #
                ),
                then=models.Value(str(_("Closed"))),
            ),
            # Internal reservations created by STAFF
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.STAFF.value)  #
                    & models.Q(recurring_reservation__isnull=False)
                    & ~models.Q(recurring_reservation__name="")
                ),
                then=models.F("recurring_reservation__name"),
            ),
            models.When(
                condition=(
                    models.Q(type=ReservationTypeChoice.STAFF.value)  #
                    & (models.Q(recurring_reservation__isnull=True) | models.Q(recurring_reservation__name=""))
                    & ~models.Q(name="")
                ),
                then=models.F("name"),
            ),
            # Organisation reservee
            models.When(
                condition=(
                    models.Q(reservee_type__in=CustomerTypeChoice.organisation)  #
                    & ~models.Q(reservee_organisation_name="")
                ),
                then=models.F("reservee_organisation_name"),
            ),
            # Individual reservee
            models.When(
                condition=(
                    ~models.Q(reservee_type__in=CustomerTypeChoice.organisation)  #
                    & (~models.Q(reservee_first_name="") | ~models.Q(reservee_last_name=""))
                ),
                then=Trim(Concat("reservee_first_name", models.Value(" "), "reservee_last_name")),
            ),
            # Use reservation name when reservee name as first fallback
            models.When(
                condition=~models.Q(name=""),
                then=models.F("name"),
            ),
            # Use the name of the User who made the reservation as the last fallback
            models.When(
                condition=(
                    models.Q(user__isnull=False)  #
                    & (
                        ~models.Q(user__first_name="")  #
                        | ~models.Q(user__last_name="")
                    )
                ),
                then=Trim(Concat("user__first_name", models.Value(" "), "user__last_name")),
            ),
            default=models.Value(""),
            output_field=models.CharField(),
        )

    @property
    def requires_handling(self) -> bool:
        return (
            self.reservation_unit.filter(require_reservation_handling=True).exists() or self.applying_for_free_of_charge
        )

    def get_location_string(self) -> str:
        locations = []
        for reservation_unit in self.reservation_unit.all():
            location = reservation_unit.actions.get_location()
            if location is not None:
                locations.append(str(location))
        return f"{', '.join(locations)}"

    def get_ical_summary(self) -> str:
        if self.name:
            return self.name
        if self.recurring_reservation is not None:
            return self.recurring_reservation.application_event.name
        return ""

    def get_ical_description(self) -> str:
        reservation_units = self.reservation_unit.all()
        unit_names = [
            reservation_unit.unit.name for reservation_unit in reservation_units if hasattr(reservation_unit, "unit")
        ]

        if self.recurring_reservation is None:
            return (
                f"{self.description}\n"
                f"{', '.join([reservation_unit.name for reservation_unit in reservation_units])}\n"
                f"{', '.join(unit_names)}\n"
                f"{self.reservation_unit.unit if hasattr(self.reservation_unit, 'unit') else ''}"
            )

        application = self.recurring_reservation.application

        application_event = self.recurring_reservation.application_event
        organisation = application.organisation
        contact_person = application.contact_person

        applicant_name = ""
        if organisation:
            applicant_name = organisation.name
        elif contact_person:
            applicant_name = f"{contact_person.first_name} {contact_person.last_name}"

        return (
            f"{applicant_name}\n"
            f"{application_event.name}\n"
            f"{self.description}\n"
            f"{', '.join([reservation_unit.name for reservation_unit in reservation_units])}\n"
            f"{', '.join(unit_names)}\n"
            f"{self.reservation_unit.unit if hasattr(self.reservation_unit, 'unit') else ''}"
        )

    @lookup_property(joins=["reservation_unit"], skip_codegen=True)
    def unit_ids_for_perms() -> list[int]:
        from spaces.models import Unit

        return SubqueryArray(  # type: ignore[return-value]
            queryset=Unit.objects.filter(reservationunit__in=models.OuterRef("reservation_unit")).values("id"),
            agg_field="id",
        )

    @unit_ids_for_perms.override
    def _(self) -> list[int]:
        return list(self.reservation_unit.select_related("unit").values_list("unit", flat=True).distinct())

    @lookup_property(joins=["reservation_unit"], skip_codegen=True)
    def unit_group_ids_for_perms() -> list[int]:
        from spaces.models import UnitGroup

        return SubqueryArray(  # type: ignore[return-value]
            queryset=UnitGroup.objects.filter(units__in=models.OuterRef("reservation_unit__unit")).values("id"),
            agg_field="id",
        )

    @unit_group_ids_for_perms.override
    def _(self) -> list[int]:
        return list(self.reservation_unit.values_list("unit__unit_groups", flat=True).distinct())


AuditLogger.register(Reservation)
