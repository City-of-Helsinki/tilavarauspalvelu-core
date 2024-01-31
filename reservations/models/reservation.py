import datetime
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin
from helsinki_gdpr.models import SerializableMixin

from applications.choices import PriorityChoice
from common.connectors import ReservationActionsConnector
from common.fields.model import IntChoiceField, StrChoiceField
from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.querysets import ReservationManager
from tilavarauspalvelu.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.utils.commons import Language

__all__ = [
    "Reservation",
]


class Reservation(ExportModelOperationsMixin("reservation"), SerializableMixin, models.Model):
    # General info
    name: str = models.CharField(max_length=255, blank=True, default="")
    sku: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=255, blank=True, default="")
    num_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)

    # Meta info
    priority: int = IntChoiceField(enum=PriorityChoice, default=PriorityChoice.MEDIUM)
    type: str | None = StrChoiceField(enum=ReservationTypeChoice, default=ReservationTypeChoice.NORMAL, null=True)
    state: str = StrChoiceField(db_index=True, enum=ReservationStateChoice, default=ReservationStateChoice.CREATED)

    # Time info
    begin: datetime.datetime = models.DateTimeField()
    end: datetime.datetime = models.DateTimeField()
    buffer_time_before: datetime.timedelta = models.DurationField(blank=True, default=datetime.timedelta())
    buffer_time_after: datetime.timedelta = models.DurationField(blank=True, default=datetime.timedelta())
    created_at: datetime.datetime | None = models.DateTimeField(null=True, default=timezone.now)
    confirmed_at: datetime.datetime | None = models.DateTimeField(null=True)
    handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    # Reservee info
    reservee_type: str | None = StrChoiceField(enum=CustomerTypeChoice, null=True, blank=True)
    reservee_first_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_last_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_organisation_name: str = models.CharField(max_length=255, blank=True, default="")
    reservee_phone: str = models.CharField(max_length=255, blank=True, default="")
    reservee_email: str | None = models.EmailField(null=True, blank=True)
    reservee_id: str = models.CharField(max_length=255, blank=True, default="")  # Business or association ID
    reservee_is_unregistered_association: bool = models.BooleanField(default=False, blank=True)
    reservee_address_street: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_city: str = models.CharField(max_length=255, blank=True, default="")
    reservee_address_zip: str = models.CharField(max_length=255, blank=True, default="")
    reservee_language: str | None = StrChoiceField(enum=Language, max_length=255, null=True, blank=True)

    # Billing info
    billing_first_name: str = models.CharField(max_length=255, blank=True, default="")
    billing_last_name: str = models.CharField(max_length=255, blank=True, default="")
    billing_phone: str = models.CharField(max_length=255, blank=True, default="")
    billing_email: str | None = models.EmailField(null=True, blank=True)
    billing_address_street: str = models.CharField(max_length=255, blank=True, default="")
    billing_address_city: str = models.CharField(max_length=255, blank=True, default="")
    billing_address_zip: str = models.CharField(max_length=255, blank=True, default="")

    # Pricing info
    price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # + VAT
    price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)  # - VAT
    non_subsidised_price: Decimal = models.DecimalField(max_digits=20, decimal_places=2, default=0)  # + VAT
    non_subsidised_price_net: Decimal = models.DecimalField(max_digits=20, decimal_places=6, default=0)  # - VAT
    unit_price: Decimal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_percentage_value: Decimal = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    # Free-of-charge info
    applying_for_free_of_charge: bool = models.BooleanField(blank=True, default=False)
    free_of_charge_reason: str = models.TextField(blank=True, default="")

    # Free text fields
    cancel_details: str = models.TextField(blank=True, default="")
    handling_details: str = models.TextField(blank=True, default="")  # for approval process
    working_memo: str = models.TextField(blank=True, default="")  # for staff users

    # Relations
    reservation_units = models.ManyToManyField(
        "reservation_units.ReservationUnit",
        related_name="reservations",
    )
    user = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reservations",
    )
    recurring_reservation = models.ForeignKey(
        "reservations.RecurringReservation",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="reservations",
    )
    home_city = models.ForeignKey(
        "applications.City",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reservations",
    )
    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reservations",
    )
    purpose = models.ForeignKey(
        "reservations.ReservationPurpose",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservations",
    )
    cancel_reason = models.ForeignKey(
        "reservations.ReservationCancelReason",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="reservations",
    )
    deny_reason = models.ForeignKey(
        "reservations.ReservationDenyReason",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="reservations",
    )

    objects = ReservationManager()
    actions = ReservationActionsConnector()

    class Meta:
        db_table = "reservation"
        base_manager_name = "objects"

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
            self.reservation_units.filter(require_reservation_handling=True).exists()
            or self.applying_for_free_of_charge
        )

    @property
    def reservee_name(self) -> str:
        # Internal recurring reservations are created by STAFF
        if self.type == ReservationTypeChoice.STAFF.value and self.recurring_reservation is not None:
            return self.recurring_reservation.name

        # Blocking reservation
        if self.type == ReservationTypeChoice.BLOCKED.value:
            return _("Closed")

        if self.reservee_type is not None:
            # Organisation reservee
            if (
                self.reservee_type in [CustomerTypeChoice.BUSINESS.value, CustomerTypeChoice.NONPROFIT.value]
                and self.reservee_organisation_name
            ):
                return self.reservee_organisation_name
            # Individual reservee
            elif self.reservee_type == CustomerTypeChoice.INDIVIDUAL.value and (
                self.reservee_first_name or self.reservee_last_name
            ):
                return f"{self.reservee_first_name} {self.reservee_last_name}".strip()

        # Use reservation name when reservee name as first fallback
        if self.name:
            return self.name

        # No name found yet, try the name of the User who made the reservation as second fallback
        if self.user is not None and (user_display_name := self.user.get_display_name()):
            return user_display_name

        # No proper name found
        return _("Unnamed reservation")


AuditLogger.register(Reservation)
