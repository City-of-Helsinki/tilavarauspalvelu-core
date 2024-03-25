from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from django.db import models
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

from common.connectors import ReservationActionsConnector
from reservations.choices import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.querysets import ReservationManager
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
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
    begin: datetime.datetime = models.DateTimeField()
    end: datetime.datetime = models.DateTimeField()
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    confirmed_at: datetime.datetime | None = models.DateTimeField(null=True)
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

    @property
    def requires_handling(self) -> bool:
        return (
            self.reservation_unit.filter(require_reservation_handling=True).exists() or self.applying_for_free_of_charge
        )

    @property
    def reservee_name(self) -> str:
        # Blocking reservation
        if self.type == ReservationTypeChoice.BLOCKED.value:
            return _("Closed")

        # Internal reservations created by STAFF
        elif self.type == ReservationTypeChoice.STAFF.value:
            if self.recurring_reservation is not None and self.recurring_reservation.name:
                return self.recurring_reservation.name
            if self.name:
                return self.name

        # Organisation reservee
        is_organization = self.reservee_type in [CustomerTypeChoice.BUSINESS.value, CustomerTypeChoice.NONPROFIT.value]
        if is_organization:
            if self.reservee_organisation_name:
                return self.reservee_organisation_name
        # Individual reservee
        elif individual_full_name := f"{self.reservee_first_name} {self.reservee_last_name}".strip():
            return individual_full_name

        # Use reservation name when reservee name as first fallback
        if self.name:
            return self.name

        # Use the name of the User who made the reservation as the last fallback
        if self.user is not None and (user_display_name := self.user.get_display_name().strip()):
            return user_display_name

        return ""

    def get_location_string(self):
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

    def get_ical_description(self):
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


AuditLogger.register(Reservation)
