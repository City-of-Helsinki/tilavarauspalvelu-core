import datetime

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

from applications.choices import PriorityChoice
from common.connectors import ReservationActionsConnector
from reservations.choices import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.querysets import ReservationManager
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

__all__ = [
    "Reservation",
]


class Reservation(SerializableMixin, models.Model):
    reservee_type = models.CharField(
        max_length=50,
        choices=CustomerTypeChoice.choices,
        null=True,
        blank=True,
        help_text="Type of reservee",
    )
    reservee_first_name = models.CharField(
        verbose_name=_("Reservee first name"), max_length=255, blank=True, default=""
    )
    reservee_last_name = models.CharField(verbose_name=_("Reservee last name"), max_length=255, blank=True, default="")
    reservee_organisation_name = models.CharField(
        verbose_name=_("Reservee organisation name"),
        max_length=255,
        blank=True,
        default="",
    )
    reservee_phone = models.CharField(verbose_name=_("Reservee phone"), max_length=255, blank=True, default="")
    reservee_email = models.EmailField(verbose_name=_("Reservee email"), null=True, blank=True)
    reservee_id = models.CharField(
        verbose_name=_("Reservee ID"),
        max_length=255,
        blank=True,
        default="",
        help_text="Reservee's business or association identity code",
    )
    reservee_is_unregistered_association = models.BooleanField(
        verbose_name=_("Reservee is an unregistered association"),
        null=False,
        default=False,
        blank=True,
    )
    reservee_address_street = models.CharField(
        verbose_name=_("Reservee address street"),
        max_length=255,
        blank=True,
        default="",
    )
    reservee_address_city = models.CharField(
        verbose_name=_("Reservee address city"),
        max_length=255,
        blank=True,
        default="",
    )
    reservee_address_zip = models.CharField(
        verbose_name=_("Reservee address zip code"),
        max_length=255,
        blank=True,
        default="",
    )
    reservee_language = models.CharField(
        verbose_name=_("Preferred language of reservee"),
        max_length=255,
        blank=True,
        default="",
        choices=RESERVEE_LANGUAGE_CHOICES,
    )
    billing_first_name = models.CharField(verbose_name=_("Billing first name"), max_length=255, blank=True, default="")
    billing_last_name = models.CharField(verbose_name=_("Billing last name"), max_length=255, blank=True, default="")
    billing_phone = models.CharField(verbose_name=_("Billing phone"), max_length=255, blank=True, default="")
    billing_email = models.EmailField(verbose_name=_("Billing email"), null=True, blank=True)
    billing_address_street = models.CharField(
        verbose_name=_("Billing address street"),
        max_length=255,
        blank=True,
        default="",
    )
    billing_address_city = models.CharField(
        verbose_name=_("Billing address city"),
        max_length=255,
        blank=True,
        default="",
    )
    billing_address_zip = models.CharField(
        verbose_name=_("Billing address zip code"),
        max_length=255,
        blank=True,
        default="",
    )
    home_city = models.ForeignKey(
        "applications.City",
        verbose_name=_("Home city"),
        related_name="home_city_reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Home city of the group or association",
    )
    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        verbose_name=_("Age group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    applying_for_free_of_charge = models.BooleanField(
        verbose_name=_("Reservee is applying for a free-of-charge reservation"),
        null=False,
        default=False,
        blank=True,
    )
    free_of_charge_reason = models.TextField(
        verbose_name=_("Reason for applying for a free-of-charge reservation"),
        null=True,
        blank=True,
    )

    sku = models.CharField(verbose_name=_("SKU"), max_length=255, blank=True, default="")
    name = models.CharField(verbose_name=_("Name"), max_length=255, blank=True, default="")
    description = models.CharField(verbose_name=_("Description"), max_length=255, blank=True, default="")

    state = models.CharField(
        max_length=32,
        choices=ReservationStateChoice.choices,
        verbose_name=_("State"),
        default=ReservationStateChoice.CREATED,
        db_index=True,
    )

    priority = models.IntegerField(choices=PriorityChoice.choices, default=PriorityChoice.MEDIUM)

    user = models.ForeignKey(
        "users.User",
        null=True,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        related_name="reservations",
    )
    begin = models.DateTimeField(verbose_name=_("Begin time"))
    end = models.DateTimeField(verbose_name=_("End time"))

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

    reservation_unit = models.ManyToManyField("reservation_units.ReservationUnit", verbose_name=_("Reservation unit"))

    recurring_reservation = models.ForeignKey(
        "reservations.RecurringReservation",
        verbose_name=_("Recurring reservation"),
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    num_persons = models.fields.PositiveIntegerField(verbose_name=_("Number of persons"), null=True, blank=True)

    purpose = models.ForeignKey(
        "reservations.ReservationPurpose",
        verbose_name=_("Reservation purpose"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    cancel_reason = models.ForeignKey(
        "reservations.ReservationCancelReason",
        verbose_name=_("Reason for cancellation"),
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    cancel_details = models.TextField(verbose_name=_("Details for this reservation's cancellation"), blank=True)

    created_at = models.DateTimeField(verbose_name=_("Created at"), null=True, default=timezone.now)
    confirmed_at = models.DateTimeField(verbose_name=_("Confirmed at"), null=True)

    unit_price = models.DecimalField(
        verbose_name=_("Unit price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="The unit price of this particular reservation",
    )
    tax_percentage_value = models.DecimalField(
        verbose_name=_("Tax percentage value"),
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="The value of the tax percentage for this particular reservation",
    )
    price = models.DecimalField(
        verbose_name=_("Price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="The price of this particular reservation including VAT",
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
        help_text="The non subsidised price of this reservation including VAT",
    )
    non_subsidised_price_net = models.DecimalField(
        verbose_name=_("Non subsidised net price"),
        max_digits=20,
        decimal_places=6,
        default=0,
        help_text="The non subsidised price of this reservation excluding VAT",
    )
    handled_at = models.DateTimeField(
        verbose_name=_("Handled at"),
        null=True,
        blank=True,
        help_text="When this reservation was handled.",
    )

    deny_reason = models.ForeignKey(
        "reservations.ReservationDenyReason",
        verbose_name=_("Reason for deny"),
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    handling_details = models.TextField(
        verbose_name=_("Handling details for this reservation"),
        blank=True,
        help_text="Additional details for denying or approving the reservation",
    )

    working_memo = models.TextField(
        verbose_name=_("Working memo"),
        null=True,
        blank=True,
        default="",
        help_text="Working memo for staff users.",
    )

    type = models.CharField(
        max_length=50,
        choices=ReservationTypeChoice.choices,
        null=True,
        blank=False,
        default=ReservationTypeChoice.NORMAL,
        help_text="Type of reservation",
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

    def save(self, force_insert=False, force_update=False, using=None, update_fields=None):
        super().save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )

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
