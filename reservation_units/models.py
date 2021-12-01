import datetime
import uuid as uuid

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from terms_of_use.models import TermsOfUse
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

Q = models.Q
User = get_user_model()


class EquipmentCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)

    def __str__(self):
        return self.name


class Equipment(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)
    category = models.ForeignKey(
        EquipmentCategory,
        verbose_name=_("Category"),
        related_name="equipment",
        on_delete=models.CASCADE,
        null=False,
    )

    def __str__(self):
        return self.name


class ReservationUnitType(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    def __str__(self):
        return self.name


class KeywordCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    def __str__(self):
        return "{}".format(self.name)


class KeywordGroup(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    keyword_category = models.ForeignKey(
        KeywordCategory,
        verbose_name=_("Keyword category"),
        related_name="keyword_groups",
        blank=False,
        null=False,
        on_delete=models.PROTECT,
    )

    def __str__(self):
        return "{}".format(self.name)


class Keyword(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    keyword_group = models.ForeignKey(
        KeywordGroup,
        verbose_name=_("Keyword group"),
        related_name="keywords",
        blank=False,
        null=False,
        on_delete=models.PROTECT,
    )

    def __str__(self):
        return "{}".format(self.name)


class ReservationUnitCancellationRule(models.Model):
    name = models.CharField(
        verbose_name=_("Name for the rule"), max_length=255, null=False, blank=False
    )
    can_be_cancelled_time_before = models.DurationField(
        verbose_name=_(
            "Time before user can cancel reservations of this reservation unit"
        ),
        blank=True,
        null=True,
        default=datetime.timedelta(hours=24),
        help_text="Seconds before reservations related to this cancellation rule can be cancelled without handling.",
    )
    needs_handling = models.BooleanField(
        default=False,
        verbose_name=_("Will the cancellation need manual staff handling"),
    )

    def __str__(self):
        return self.name


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(
        verbose_name=_("Description"), blank=True, default=""
    )
    spaces = models.ManyToManyField(
        Space, verbose_name=_("Spaces"), related_name="reservation_units", blank=True
    )

    keyword_groups = models.ManyToManyField(
        KeywordGroup,
        verbose_name=_("Keyword groups"),
        related_name="reservation_units",
        blank=True,
    )

    resources = models.ManyToManyField(
        Resource,
        verbose_name=_("Resources"),
        related_name="reservation_units",
        blank=True,
    )
    services = models.ManyToManyField(
        Service,
        verbose_name=_("Services"),
        related_name="reservation_units",
        blank=True,
    )
    purposes = models.ManyToManyField(
        "Purpose",
        verbose_name=_("Purposes"),
        related_name="reservation_units",
        blank=True,
    )
    reservation_unit_type = models.ForeignKey(
        ReservationUnitType,
        verbose_name=_("Type"),
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    require_introduction = models.BooleanField(
        verbose_name=_("Require introduction"), default=False
    )
    equipments = models.ManyToManyField(
        Equipment,
        verbose_name=_("Equipments"),
        blank=True,
    )
    terms_of_use = models.TextField(
        verbose_name=_("Terms of use"), blank=True, max_length=2000
    )
    payment_terms = models.ForeignKey(
        TermsOfUse,
        related_name="payment_terms_reservation_unit",
        verbose_name=_("Payment terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    cancellation_terms = models.ForeignKey(
        TermsOfUse,
        related_name="cancellation_terms_reservation_unit",
        verbose_name=_("Cancellation terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    service_specific_terms = models.ForeignKey(
        TermsOfUse,
        related_name="service_specific_terms_reservation_unit",
        verbose_name=_("Service-specific terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    unit = models.ForeignKey(
        Unit,
        verbose_name=_("Unit"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    contact_information = models.TextField(
        verbose_name=_("Contact information"),
        blank=True,
        default="",
    )
    max_reservation_duration = models.DurationField(
        verbose_name=_("Maximum reservation duration"), blank=True, null=True
    )
    min_reservation_duration = models.DurationField(
        verbose_name=_("Minimum reservation duration"), blank=True, null=True
    )

    uuid = models.UUIDField(default=uuid.uuid4, null=False, editable=False, unique=True)

    is_draft = models.BooleanField(
        default=False,
        verbose_name=_("Is this in draft state"),
        blank=True,
        db_index=True,
    )

    max_persons = models.fields.PositiveIntegerField(
        verbose_name=_("Maximum number of persons"), null=True, blank=True
    )

    surface_area = models.DecimalField(
        verbose_name=_("Surface area"),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    buffer_time_between_reservations = models.DurationField(
        verbose_name=_("Buffer time between reservations"), blank=True, null=True
    )

    hauki_resource_id = models.CharField(
        verbose_name=_("Hauki resource id"), max_length=255, blank=True, null=True
    )

    cancellation_rule = models.ForeignKey(
        ReservationUnitCancellationRule,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
    )

    PRICE_UNIT_PER_15_MINS = "per_15_mins"
    PRICE_UNIT_PER_30_MINS = "per_30_mins"
    PRICE_UNIT_PER_HOUR = "per_hour"
    PRICE_UNIT_PER_HALF_DAY = "per_half_day"
    PRICE_UNIT_PER_DAY = "per_day"
    PRICE_UNIT_PER_WEEK = "per_week"
    PRICE_UNIT_FIXED = "fixed"
    PRICE_UNITS = (
        (PRICE_UNIT_PER_15_MINS, _("per 15 minutes")),
        (PRICE_UNIT_PER_30_MINS, _("per 30 minutes")),
        (PRICE_UNIT_PER_HOUR, _("per hour")),
        (PRICE_UNIT_PER_HALF_DAY, _("per half a day")),
        (PRICE_UNIT_PER_DAY, _("per day")),
        (PRICE_UNIT_PER_WEEK, _("per week")),
        (PRICE_UNIT_FIXED, _("fixed")),
    )
    price_unit = models.CharField(
        max_length=20,
        verbose_name=_("Price unit"),
        choices=PRICE_UNITS,
        default=PRICE_UNIT_PER_HOUR,
        help_text="Unit of the price",
    )
    lowest_price = models.DecimalField(
        verbose_name=_("Lowest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Minimum price of the reservation unit",
    )
    highest_price = models.DecimalField(
        verbose_name=_("Highest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Maximum price of the reservation unit",
    )
    price = models.DecimalField(
        verbose_name=_("Price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="The current list price for reservation units with a fixed price",
    )

    def __str__(self):
        return "{}".format(self.name)

    def get_location(self):
        # For now we assume that if reservation has multiple spaces they all have same location
        spaces = self.spaces.all()
        return next(
            (space.location for space in spaces if hasattr(space, "location")), None
        )

    def get_building(self):
        # For now we assume that if reservation has multiple spaces they all have same building
        spaces = self.spaces.all()
        return next(
            (space.building for space in spaces if hasattr(space, "building")), None
        )

    def get_max_persons(self):
        # Sum of max persons for all spaces because group can be divided to different spaces
        spaces = self.spaces.all()
        return sum(filter(None, (space.max_persons for space in spaces))) or None

    def check_required_introduction(self, user):
        return Introduction.objects.filter(reservation_unit=self, user=user).exists()

    def check_reservation_overlap(self, start_time, end_time, reservation=None):
        from reservations.models import STATE_CHOICES, Reservation

        qs = Reservation.objects.filter(
            reservation_unit__in=self.reservation_units_with_same_components,
            end__gt=start_time,
            begin__lt=end_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        # If updating an existing reservation, allow "overlapping" it's old time
        if reservation:
            qs = qs.exclude(pk=reservation.pk)

        return qs.exists()

    def get_next_reservation(self, end_time: datetime.datetime, reservation=None):
        from reservations.models import STATE_CHOICES, Reservation

        qs = Reservation.objects.filter(
            reservation_unit__in=self.reservation_units_with_same_components,
            begin__gte=end_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        return qs.order_by("-begin").first()

    def get_previous_reservation(self, start_time: datetime.datetime, reservation=None):
        from reservations.models import STATE_CHOICES, Reservation

        qs = Reservation.objects.filter(
            reservation_unit__in=self.reservation_units_with_same_components,
            end__lte=start_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        return qs.order_by("-end").first()

    @property
    def reservation_units_with_same_components(self):
        spaces = []
        for space in self.spaces.all():
            spaces += list(space.get_family())

        return ReservationUnit.objects.filter(
            Q(resources__in=self.resources.all()) | Q(spaces__in=spaces)
        ).distinct()

    @property
    def hauki_resource_origin_id(self):
        return str(self.uuid)

    @property
    def hauki_resource_data_source_id(self):
        return settings.HAUKI_ORIGIN_ID


class ReservationUnitImage(models.Model):
    TYPES = (
        ("main", _("Main image")),
        ("ground_plan", _("Ground plan")),
        ("map", _("Map")),
        ("other", _("Other")),
    )

    image_type = models.CharField(max_length=20, verbose_name=_("Type"), choices=TYPES)

    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit image"),
        related_name="images",
        on_delete=models.CASCADE,
    )

    image = ThumbnailerImageField(
        upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT,
        null=True,
    )

    def __str__(self):
        return "{} ({})".format(
            self.reservation_unit.name, self.get_image_type_display()
        )


class Purpose(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Period(models.Model):
    """
    A period of time to express state of open or closed
    Days that specifies the actual activity hours link here
    """

    LENGTH_WITHIN_DAY = "within_day"
    LENGTH_WHOLE_DAY = "whole_day"
    LENGTH_OVER_NIGHT = "over_night"
    RESERVATION_LENGHT_TYPE_CHOICES = (
        (LENGTH_WITHIN_DAY, _("within day")),
        (LENGTH_WHOLE_DAY, _("whole day")),
        (LENGTH_OVER_NIGHT, _("over night")),
    )

    reservation_length_type = models.CharField(
        max_length=16,
        choices=RESERVATION_LENGHT_TYPE_CHOICES,
        verbose_name=_("Reservations length type"),
        default=LENGTH_WITHIN_DAY,
    )
    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        db_index=True,
        null=True,
        blank=True,
        related_name="periods",
        on_delete=models.CASCADE,
    )

    start = models.DateField(verbose_name=_("Start date"))
    end = models.DateField(verbose_name=_("End date"))

    name = models.CharField(
        max_length=200, verbose_name=_("Name"), blank=True, default=""
    )
    description = models.CharField(
        verbose_name=_("Description"), null=True, blank=True, max_length=500
    )
    closed = models.BooleanField(
        verbose_name=_("Closed"), default=False, editable=False
    )

    def __str__(self):
        return "{}({} - {})".format(self.reservation_unit.name, self.start, self.end)


class Day(models.Model):
    """
    Day of week and its active start and end time and whether it is open or closed

    Kirjastot.fi API uses closed for both days and periods, don't know which takes precedence
    """

    DAYS_OF_WEEK = (
        (0, _("Monday")),
        (1, _("Tuesday")),
        (2, _("Wednesday")),
        (3, _("Thursday")),
        (4, _("Friday")),
        (5, _("Saturday")),
        (6, _("Sunday")),
    )

    period = models.ForeignKey(
        Period,
        verbose_name=_("Period"),
        db_index=True,
        related_name="days",
        on_delete=models.CASCADE,
    )
    weekday = models.IntegerField(verbose_name=_("Weekday"), choices=DAYS_OF_WEEK)
    opens = models.TimeField(verbose_name=_("Time when opens"), null=True, blank=True)
    closes = models.TimeField(verbose_name=_("Time when closes"), null=True, blank=True)

    def __str__(self):
        return "{}({})".format(
            self.get_weekday_display(), self.period.reservation_unit.name
        )


class DayPart(models.Model):
    ALLOWED_EVERYONE = "allowed_everyone"
    ALLOWED_PUBLIC = "allowed_public"
    ALLOWED_STAFF = "allowed_staff"

    ALLOWED_GROUP_CHOICES = (
        (ALLOWED_EVERYONE, _("Everyone allowed")),
        (ALLOWED_PUBLIC, _("Public allowed")),
        (ALLOWED_STAFF, _("Staff allowed")),
    )

    allowed_group = models.CharField(max_length=255, choices=ALLOWED_GROUP_CHOICES)
    begin = models.TimeField(
        verbose_name=_("Begin time of day part"), null=True, blank=True
    )
    end = models.TimeField(
        verbose_name=_("End time of day part"), null=True, blank=True
    )
    day = models.ForeignKey(Day, verbose_name=_("Day"), on_delete=models.CASCADE)

    def __str__(self):
        return "{} {} ({}-{})".format(
            self.day.period.reservation_unit.name,
            self.day.get_weekday_display(),
            self.begin,
            self.end,
        )


class Introduction(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    reservation_unit = models.ForeignKey(
        ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.CASCADE
    )

    completed_at = models.DateTimeField(verbose_name=_("Completed at"))


AuditLogger.register(ReservationUnit)
