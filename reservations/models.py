from datetime import date, datetime
from uuid import UUID, uuid4

from django.contrib.auth import get_user_model
from django.core.validators import validate_comma_separated_integer_list
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin
from helsinki_gdpr.models import SerializableMixin

from applications.choices import PriorityChoice
from applications.models import City
from common.connectors import ReservationActionsConnector
from reservation_units.models import ReservationUnit
from reservations.choices import (
    RESERVEE_LANGUAGE_CHOICES,
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from reservations.querysets import ReservationManager
from tilavarauspalvelu.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.utils.commons import WEEKDAYS

User = get_user_model()


class AgeGroup(models.Model):
    minimum = models.fields.PositiveIntegerField(null=False, blank=False)
    maximum = models.fields.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.minimum} - {self.maximum}"


class AbilityGroup(models.Model):
    name = models.fields.TextField(null=False, blank=False, unique=True)

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name


class ReservationCancelReason(models.Model):
    reason = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.reason


class ReservationDenyReason(models.Model):
    reason = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.reason


class RecurringReservation(models.Model):
    name: str = models.CharField(max_length=255, blank=True, default="")
    description: str = models.CharField(max_length=500, blank=True, default="")
    uuid: UUID = models.UUIDField(default=uuid4, editable=False, unique=True)
    user: User | None = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    begin_date: date | None = models.DateField(null=True)
    begin_time: date | None = models.TimeField(null=True)
    end_date: date | None = models.DateField(null=True)
    end_time: date | None = models.TimeField(null=True)

    application_event_schedule = models.ForeignKey(
        "applications.ApplicationEventSchedule",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="recurring_reservations",
    )

    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="recurring_reservations",
    )

    recurrence_in_days: int | None = models.PositiveIntegerField(null=True)
    """How many days between reoccurring reservations"""

    weekdays: str = models.CharField(
        max_length=16,
        validators=[validate_comma_separated_integer_list],
        choices=WEEKDAYS.CHOICES,
        blank=True,
        default="",
    )

    age_group = models.ForeignKey(
        "reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    ability_group = models.ForeignKey(
        "reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recurring_reservations",
    )

    created: datetime = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "recurring_reservation"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.name}"

    @property
    def denied_reservations(self):
        # Avoid a query to the database if we have fetched list already
        if "reservations" in self._prefetched_objects_cache:
            return [
                reservation
                for reservation in self.reservations.all()
                if reservation.state == ReservationStateChoice.DENIED
            ]

        return self.reservations.filter(state=ReservationStateChoice.DENIED)

    @property
    def weekday_list(self):
        if self.weekdays:
            return [int(i) for i in self.weekdays.split(",")]
        return []


class Reservation(ExportModelOperationsMixin("reservation"), SerializableMixin, models.Model):
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
        City,
        verbose_name=_("Home city"),
        related_name="home_city_reservation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Home city of the group or association",
    )
    age_group = models.ForeignKey(
        AgeGroup,
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
        User,
        null=True,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        related_name="reservations",
    )
    begin = models.DateTimeField(verbose_name=_("Begin time"))
    end = models.DateTimeField(verbose_name=_("End time"))

    buffer_time_before = models.DurationField(verbose_name=_("Buffer time before"), blank=True, null=True)
    buffer_time_after = models.DurationField(verbose_name=_("Buffer time after"), blank=True, null=True)

    reservation_unit = models.ManyToManyField(ReservationUnit, verbose_name=_("Reservation unit"))

    recurring_reservation = models.ForeignKey(
        RecurringReservation,
        verbose_name=_("Recurring reservation"),
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    num_persons = models.fields.PositiveIntegerField(verbose_name=_("Number of persons"), null=True, blank=True)

    purpose = models.ForeignKey(
        "ReservationPurpose",
        verbose_name=_("Reservation purpose"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    cancel_reason = models.ForeignKey(
        ReservationCancelReason,
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
        ReservationDenyReason,
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

    def get_location_string(self):
        locations = []
        for reservation_unit in self.reservation_unit.all():
            location = reservation_unit.get_location()
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


class ReservationPurpose(models.Model):
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name


class ReservationMetadataField(models.Model):
    field_name = models.CharField(max_length=100, verbose_name=_("Field name"), unique=True)

    class Meta:
        db_table = "reservation_metadata_field"
        base_manager_name = "objects"
        verbose_name = _("Reservation metadata field")
        verbose_name_plural = _("Reservation metadata fields")

    def __str__(self) -> str:
        return self.field_name


class ReservationMetadataSet(models.Model):
    name = models.CharField(max_length=100, verbose_name=_("Name"), unique=True)
    supported_fields = models.ManyToManyField(
        ReservationMetadataField,
        verbose_name=_("Supported fields"),
        related_name="metadata_sets_supported",
    )
    required_fields = models.ManyToManyField(
        ReservationMetadataField,
        verbose_name=_("Required fields"),
        related_name="metadata_sets_required",
        blank=True,
    )

    class Meta:
        db_table = "reservation_metadata_set"
        base_manager_name = "objects"
        verbose_name = _("Reservation metadata set")
        verbose_name_plural = _("Reservation metadata sets")

    def __str__(self) -> str:
        return self.name


class ReservationStatistic(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.SET_NULL, null=True)

    reservation_created_at = models.DateTimeField(verbose_name=_("Created at"), null=True, default=timezone.now)

    reservation_handled_at = models.DateTimeField(
        verbose_name=_("Handled at"),
        null=True,
        blank=True,
        help_text="When this reservation was handled.",
    )

    reservation_confirmed_at = models.DateTimeField(verbose_name=_("Confirmed at"), null=True)

    buffer_time_before = models.DurationField(verbose_name=_("Buffer time before"), blank=True, null=True)
    buffer_time_after = models.DurationField(verbose_name=_("Buffer time after"), blank=True, null=True)

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
        City,
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
        AgeGroup,
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
        AbilityGroup,
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
        ReservationCancelReason,
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
        ReservationDenyReason,
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

    primary_reservation_unit = models.ForeignKey(ReservationUnit, null=True, on_delete=models.SET_NULL)

    primary_reservation_unit_name = models.CharField(verbose_name=_("Name"), max_length=255)
    primary_unit_tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
        max_length=255,
        null=True,
    )
    primary_unit_name = models.CharField(verbose_name=_("Name"), max_length=255)

    class Meta:
        db_table = "reservation_statistics"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.reservee_uuid} - {self.begin} - {self.end}"


class ReservationStatisticsReservationUnit(models.Model):
    reservation_statistics = models.ForeignKey(
        ReservationStatistic,
        on_delete=models.CASCADE,
        related_name="reservation_stats_reservation_units",
    )
    reservation_unit = models.ForeignKey(ReservationUnit, null=True, on_delete=models.SET_NULL)
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


AuditLogger.register(Reservation)
