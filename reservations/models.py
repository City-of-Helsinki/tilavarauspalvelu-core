from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import F, Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from applications.models import (
    CUSTOMER_TYPES,
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationRound,
    City,
)
from reservation_units.models import ReservationUnit
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

Q = models.Q
User = get_user_model()


class AgeGroup(models.Model):

    minimum = models.fields.PositiveIntegerField(
        verbose_name=_("Minimum"), null=False, blank=False
    )

    maximum = models.fields.PositiveIntegerField(
        verbose_name=_("Maximum"), null=True, blank=True
    )

    def __str__(self):
        return "{} - {}".format(self.minimum, self.maximum)


class AbilityGroup(models.Model):

    name = models.fields.TextField(
        verbose_name=_("Name"), null=False, blank=False, unique=True
    )

    def __str__(self):
        return self.name


class ReservationCancelReason(models.Model):
    reason = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        verbose_name=_("Reason for cancellation"),
    )


class RecurringReservation(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )

    application = models.ForeignKey(
        Application,
        verbose_name=_("Application"),
        related_name="recurring_reservation",
        null=False,
        blank=True,
        on_delete=models.PROTECT,
    )

    application_event = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
        related_name="recurring_reservation",
        null=False,
        blank=True,
        on_delete=models.PROTECT,
    )

    age_group = models.ForeignKey(
        AgeGroup,
        verbose_name=_("Age group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    ability_group = models.ForeignKey(
        AbilityGroup,
        verbose_name=_("Ability group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    @property
    def denied_reservations(self):
        return self.reservations.filter(state=STATE_CHOICES.DENIED)


class STATE_CHOISE_CONST(object):
    __slots__ = ()

    CREATED = "created"
    CANCELLED = "cancelled"
    CONFIRMED = "confirmed"
    DENIED = "denied"
    STATE_CHOICES = (
        (CREATED, _("created")),
        (CANCELLED, _("cancelled")),
        (CONFIRMED, _("confirmed")),
        (DENIED, _("denied")),
    )


STATE_CHOICES = STATE_CHOISE_CONST()


class ReservationQuerySet(models.QuerySet):
    def total_duration(self):
        return self.annotate(duration=F("end") - F("begin")).aggregate(
            total_duration=Sum("duration")
        )

    def within_application_round_period(self, app_round: ApplicationRound):
        return self.within_period(
            app_round.reservation_period_begin,
            app_round.reservation_period_end,
        )

    def within_period(self, period_start, period_end):
        return self.filter(
            begin__gte=period_start,
            end__lte=period_end,
        )

    def going_to_occur(self):
        return self.filter(
            state__in=(
                STATE_CHOICES.CREATED,
                STATE_CHOICES.CONFIRMED,
            )
        )

    def handling_required(self):
        """These do not consider the application process (RecurringReservation)."""
        return self.filter(
            state=STATE_CHOICES.CONFIRMED,
            reservation_unit__metadata_set__isnull=False,
            recurring_reservation=None,
        )

    def active(self):
        return self.filter(end__gte=timezone.now()).going_to_occur()


class Reservation(models.Model):
    objects = ReservationQuerySet.as_manager()

    reservee_type = models.CharField(
        max_length=50,
        choices=CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES,
        null=True,
        blank=True,
        help_text="Type of reservee",
    )
    reservee_first_name = models.CharField(
        verbose_name=_("Reservee first name"), max_length=255, blank=True, default=""
    )
    reservee_last_name = models.CharField(
        verbose_name=_("Reservee last name"), max_length=255, blank=True, default=""
    )
    reservee_organisation_name = models.CharField(
        verbose_name=_("Reservee organisation name"),
        max_length=255,
        blank=True,
        default="",
    )
    reservee_phone = models.CharField(
        verbose_name=_("Reservee phone"), max_length=255, blank=True, default=""
    )
    reservee_email = models.EmailField(
        verbose_name=_("Reservee email"), null=True, blank=True
    )
    reservee_id = models.CharField(
        verbose_name=_("Reservee phone"),
        max_length=10,
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
    billing_first_name = models.CharField(
        verbose_name=_("Billing first name"), max_length=255, blank=True, default=""
    )
    billing_last_name = models.CharField(
        verbose_name=_("Billing last name"), max_length=255, blank=True, default=""
    )
    billing_phone = models.CharField(
        verbose_name=_("Billing phone"), max_length=255, blank=True, default=""
    )
    billing_email = models.EmailField(
        verbose_name=_("Billing email"), null=True, blank=True
    )
    billing_address_street = models.CharField(
        verbose_name=_("Reservee address street"),
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
        verbose_name=_("Reservee address zip code"),
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

    name = models.CharField(
        verbose_name=_("Name"), max_length=255, blank=True, default=""
    )
    description = models.CharField(
        verbose_name=_("Description"), max_length=255, blank=True, default=""
    )

    state = models.CharField(
        max_length=32,
        choices=STATE_CHOICES.STATE_CHOICES,
        verbose_name=_("State"),
        default=STATE_CHOICES.CREATED,
    )

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    begin = models.DateTimeField(verbose_name=_("Begin time"))
    end = models.DateTimeField(verbose_name=_("End time"))

    buffer_time_before = models.DurationField(
        verbose_name=_("Buffer time before"), blank=True, null=True
    )
    buffer_time_after = models.DurationField(
        verbose_name=_("Buffer time after"), blank=True, null=True
    )

    reservation_unit = models.ManyToManyField(
        ReservationUnit, verbose_name=_("Reservation unit")
    )

    recurring_reservation = models.ForeignKey(
        RecurringReservation,
        verbose_name=_("Recurring reservation"),
        related_name="reservations",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    num_persons = models.fields.PositiveIntegerField(
        verbose_name=_("Number of persons"), null=True, blank=True
    )

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

    cancel_details = models.TextField(
        verbose_name=_("Details for this reservation's cancellation"), blank=True
    )

    confirmed_at = models.DateTimeField(verbose_name=_("Confirmed at"), null=True)

    unit_price = models.DecimalField(
        verbose_name=_("Unit price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="The price of this particular reservation",
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
        help_text="The price of this particular reservation",
    )

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
            reservation_unit.unit.name
            for reservation_unit in reservation_units
            if hasattr(reservation_unit, "unit")
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

    def __str__(self) -> str:
        return self.name


class ReservationMetadataField(models.Model):
    field_name = models.CharField(
        max_length=100, verbose_name=_("Field name"), unique=True
    )

    class Meta:
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
        verbose_name = _("Reservation metadata set")
        verbose_name_plural = _("Reservation metadata sets")

    def __str__(self) -> str:
        return self.name


AuditLogger.register(Reservation)
