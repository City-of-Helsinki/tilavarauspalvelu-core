import uuid
from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.validators import validate_comma_separated_integer_list
from django.db import models
from django.db.models import F, Sum
from django.utils import timezone
from django.utils.timezone import get_current_timezone
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin

from applications.models import (
    CUSTOMER_TYPES,
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationRound,
    City,
)
from merchants.models import OrderStatus
from reservation_units.models import ReservationUnit
from tilavarauspalvelu import settings
from tilavarauspalvelu.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.utils.commons import WEEKDAYS

Q = models.Q
User = get_user_model()

RESERVEE_LANGUAGE_CHOICES = settings.LANGUAGES + (("", ""),)


class ReservationType(models.TextChoices):
    NORMAL = "normal"
    BLOCKED = "blocked"
    STAFF = "staff"
    BEHALF = "behalf"


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


class ReservationDenyReason(models.Model):
    reason = models.CharField(
        max_length=255,
        null=False,
        blank=False,
        verbose_name=_("Reason for deny"),
    )


class RecurringReservation(models.Model):
    uuid = models.UUIDField(default=uuid.uuid4, null=False, editable=False, unique=True)
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
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    application_event = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
        related_name="recurring_reservation",
        null=True,
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

    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        null=False,
        on_delete=models.PROTECT,
    )

    created = models.DateTimeField(
        auto_now_add=True,
    )

    name = models.CharField(
        max_length=255,
        null=False,
        blank=True,
        default="",
    )

    description = models.CharField(
        max_length=500,
        null=False,
        default="",
        blank=True,
    )

    recurrence_in_days = models.PositiveIntegerField(
        null=True,
        help_text=_(
            "How this recurring reservation's reservations occurs within days. "
            "E.g 7 means that it occurs every week. 14 every other week"
        ),
    )

    weekdays = models.CharField(
        max_length=16,
        validators=[validate_comma_separated_integer_list],
        choices=WEEKDAYS.CHOICES,
        blank=True,
        default="",
    )

    begin_time = models.TimeField(verbose_name=_("Begin time"), null=True)

    end_time = models.TimeField(verbose_name=_("End time"), null=True)

    begin_date = models.DateField(verbose_name=("Begin date"), null=True)

    end_date = models.DateField(verbose_name=_("End date"), null=True)

    @property
    def denied_reservations(self):
        # Avoid a query to the database if we have fetched list already
        if "reservations" in self._prefetched_objects_cache:
            return [
                reservation
                for reservation in self.reservations.all()
                if reservation.state == STATE_CHOICES.DENIED
            ]

        return self.reservations.filter(state=STATE_CHOICES.DENIED)

    @property
    def weekday_list(self):
        if self.weekdays:
            return [int(i) for i in self.weekdays.split(",")]
        return []


class STATE_CHOISE_CONST(object):
    __slots__ = ()

    CREATED = "created"
    CANCELLED = "cancelled"
    REQUIRES_HANDLING = "requires_handling"
    WAITING_FOR_PAYMENT = "waiting_for_payment"
    CONFIRMED = "confirmed"
    DENIED = "denied"
    STATE_CHOICES = (
        (CREATED, _("created")),
        (CANCELLED, _("cancelled")),
        (REQUIRES_HANDLING, _("requires_handling")),
        (WAITING_FOR_PAYMENT, _("waiting_for_payment")),
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
                STATE_CHOICES.WAITING_FOR_PAYMENT,
                STATE_CHOICES.REQUIRES_HANDLING,
            )
        )

    def active(self):
        return self.filter(end__gte=timezone.now()).going_to_occur()

    def inactive(self, older_than_minutes: int):
        return self.filter(
            state=STATE_CHOICES.CREATED,
            created_at__lte=datetime.now(tz=get_current_timezone())
            - timedelta(minutes=older_than_minutes),
        )

    def with_same_components(self, reservation_unit, begin, end):
        if begin and end:
            return self.filter(
                reservation_unit__in=reservation_unit.reservation_units_with_same_components,
                end__lte=end,
                begin__gte=begin,
            ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])
        return self.none()

    def with_inactive_payments(self, older_than_minutes: int):
        return self.filter(
            state=STATE_CHOICES.WAITING_FOR_PAYMENT,
            payment_order__remote_id__isnull=False,
            payment_order__status__in=[OrderStatus.EXPIRED, OrderStatus.CANCELLED],
            payment_order__created_at__lte=datetime.now(tz=get_current_timezone())
            - timedelta(minutes=older_than_minutes),
        )


class Reservation(ExportModelOperationsMixin("reservation"), models.Model):
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
        verbose_name=_("Reservee ID"),
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
    reservee_language = models.CharField(
        verbose_name=_("Preferred language of reservee"),
        max_length=255,
        blank=True,
        default="",
        choices=RESERVEE_LANGUAGE_CHOICES,
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

    sku = models.CharField(
        verbose_name=_("SKU"), max_length=255, blank=True, default=""
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

    created_at = models.DateTimeField(
        verbose_name=_("Created at"), null=True, default=timezone.now
    )
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
        decimal_places=6,
        default=0,
        help_text="The non subsidised price of this reservation excluding VAT",
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
        choices=ReservationType.choices,
        null=True,
        blank=False,
        default=ReservationType.NORMAL,
        help_text="Type of reservation",
    )

    def _requires_handling(self):
        return (
            self.reservation_unit.filter(require_reservation_handling=True).exists()
            or self.applying_for_free_of_charge
        )

    def save(
        self, force_insert=False, force_update=False, using=None, update_fields=None
    ):
        super().save(
            force_insert=force_insert,
            force_update=force_update,
            using=using,
            update_fields=update_fields,
        )

        self.__create_or_update_reservation_statistics()

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

    def __create_or_update_reservation_statistics(self):
        recurring = getattr(self, "recurring_reservation", None)
        stat, created = ReservationStatistic.objects.update_or_create(
            reservation=self,
            defaults={
                "reservation": self,
                "reservation_created_at": self.created_at,
                "reservation_handled_at": self.handled_at,
                "reservation_confirmed_at": self.confirmed_at,
                "reservee_type": self.reservee_type,
                "applying_for_free_of_charge": self.applying_for_free_of_charge,
                "reservee_language": self.reservee_language,
                "num_persons": self.num_persons,
                "priority": self.priority,
                "home_city": self.home_city,
                "purpose": self.purpose,
                "age_group": self.age_group,
                "age_group_min": getattr(self.age_group, "minimum", None),
                "age_group_max": getattr(self.age_group, "maximum", None),
                "is_applied": getattr(recurring, "application", None) is not None,
                "ability_group": getattr(
                    self.recurring_reservation, "ability_group", None
                ),
                "begin": self.begin,
                "end": self.end,
                "duration_minutes": (self.end - self.begin).total_seconds() / 60,
                "reservation_type": self.type,
                "state": self.state,
                "cancel_reason": self.cancel_reason,
                "cancel_reason_text": getattr(self.cancel_reason, "reason", ""),
                "deny_reason": self.deny_reason,
                "deny_reason_text": getattr(self.deny_reason, "reason", ""),
                "price": self.price,
                "tax_percentage_value": self.tax_percentage_value,
                "non_subsidised_price": self.non_subsidised_price,
                "non_subsidised_price_net": self.non_subsidised_price_net,
                "is_subsidised": self.price < self.non_subsidised_price,
                "is_recurring": recurring is not None,
                "recurrence_begin_date": getattr(recurring, "begin_date", None),
                "recurrence_end_date": getattr(recurring, "end_date", None),
                "recurrence_uuid": getattr(recurring, "uuid", ""),
                "reservee_uuid": str(self.user.tvp_uuid) if self.user else "",
            },
        )

        for res_unit in self.reservation_unit.all():
            ReservationStatisticsReservationUnit.objects.get_or_create(
                reservation_statistics=stat,
                reservation_unit=res_unit,
                defaults={
                    "reservation_statistics": stat,
                    "reservation_unit": res_unit,
                    "unit_tprek_id": res_unit.unit.tprek_id,
                    "name": res_unit.name,
                    "unit_name": res_unit.unit.name,
                },
            )

        stat.reservation_stats_reservation_units.exclude(
            reservation_unit__in=self.reservation_unit.all()
        ).delete()

        res_unit = self.reservation_unit.first()
        if res_unit:
            stat.primary_reservation_unit = res_unit
            stat.primary_reservation_unit_name = res_unit.name
            stat.primary_unit_name = res_unit.unit.name
            stat.primary_unit_tprek_id = res_unit.unit.tprek_id

        if stat.is_applied and self.recurring_reservation.ability_group:
            stat.ability_group_name = self.recurring_reservation.ability_group.name

        stat.save()


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


class ReservationStatistic(models.Model):
    reservation = models.OneToOneField(
        Reservation, on_delete=models.SET_NULL, null=True
    )

    reservation_created_at = models.DateTimeField(
        verbose_name=_("Created at"), null=True, default=timezone.now
    )

    reservation_handled_at = models.DateTimeField(
        verbose_name=_("Handled at"),
        null=True,
        blank=True,
        help_text="When this reservation was handled.",
    )

    reservation_confirmed_at = models.DateTimeField(
        verbose_name=_("Confirmed at"), null=True
    )

    updated_at = models.DateTimeField(
        verbose_name=_("Statistics updated at"), null=True, blank=True, auto_now=True
    )

    reservee_type = models.CharField(
        max_length=50,
        choices=CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES,
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

    num_persons = models.fields.PositiveIntegerField(
        verbose_name=_("Number of persons"), null=True, blank=True
    )

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

    home_city = models.ForeignKey(
        City,
        verbose_name=_("Home city"),
        related_name="reservation_statistics",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Home city of the group or association",
    )

    purpose = models.ForeignKey(
        "ReservationPurpose",
        verbose_name=_("Reservation purpose"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    age_group = models.ForeignKey(
        AgeGroup,
        verbose_name=_("Age group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    age_group_min = models.fields.PositiveIntegerField(
        verbose_name=_("Minimum"), null=True, blank=False
    )

    age_group_max = models.fields.PositiveIntegerField(
        verbose_name=_("Maximum"), null=True, blank=True
    )

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

    duration_minutes = models.IntegerField(
        null=False, verbose_name=_("Reservation duration in minutes")
    )

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
    non_subsidised_price = models.DecimalField(
        verbose_name=_("Non subsidised price"),
        max_digits=20,
        decimal_places=6,
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
    is_subsidised = models.BooleanField(
        help_text="Is the reservation price subsidised", default=False
    )
    is_recurring = models.BooleanField(
        help_text="Is the reservation recurring", default=False
    )
    recurrence_begin_date = models.DateField(
        verbose_name="Recurrence begin date", null=True
    )
    recurrence_end_date = models.DateField(
        verbose_name="Recurrence end date", null=True
    )
    recurrence_uuid = models.CharField(
        verbose_name="Recurrence UUID", max_length=255, default="", blank=True
    )
    reservee_uuid = models.CharField(
        verbose_name="Reservee UUID", max_length=255, default="", blank=True
    )
    tax_percentage_value = models.DecimalField(
        verbose_name=_("Tax percentage value"),
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="The value of the tax percentage for this particular reservation",
    )

    primary_reservation_unit = models.ForeignKey(
        ReservationUnit, null=True, on_delete=models.SET_NULL
    )

    primary_reservation_unit_name = models.CharField(
        verbose_name=_("Name"), max_length=255
    )
    primary_unit_tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
        max_length=255,
        null=True,
    )
    primary_unit_name = models.CharField(verbose_name=_("Name"), max_length=255)


class ReservationStatisticsReservationUnit(models.Model):
    reservation_statistics = models.ForeignKey(
        ReservationStatistic,
        on_delete=models.CASCADE,
        related_name="reservation_stats_reservation_units",
    )
    reservation_unit = models.ForeignKey(
        ReservationUnit, null=True, on_delete=models.SET_NULL
    )
    unit_tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
        max_length=255,
        null=True,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    unit_name = models.CharField(verbose_name=_("Name"), max_length=255)


AuditLogger.register(Reservation)
