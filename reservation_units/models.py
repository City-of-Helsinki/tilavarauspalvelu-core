import datetime
import uuid as uuid
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import QuerySet
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin
from easy_thumbnails.fields import ThumbnailerImageField
from easy_thumbnails.files import get_thumbnailer
from elasticsearch_django.models import (
    SearchDocumentManagerMixin,
    SearchDocumentMixin,
    SearchResultsQuerySet,
)

from merchants.models import PaymentAccounting, PaymentMerchant, PaymentProduct
from reservation_units.enums import ReservationState, ReservationUnitState
from reservation_units.tasks import (
    purge_image_cache,
    refresh_reservation_unit_product_mapping,
    update_urls,
)
from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from terms_of_use.models import TermsOfUse
from tilavarauspalvelu.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.utils.commons import WEEKDAYS

Q = models.Q
User = get_user_model()


class EquipmentCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)
    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

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
    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

    class Meta:
        ordering = ["rank"]

    def __str__(self):
        return self.name


class KeywordCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    def __str__(self):
        return f"{self.name}"


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
        return f"{self.name}"


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
        return f"{self.name}"


class ReservationUnitCancellationRule(models.Model):
    name = models.CharField(verbose_name=_("Name for the rule"), max_length=255, null=False, blank=False)
    can_be_cancelled_time_before = models.DurationField(
        verbose_name=_("Time before user can cancel reservations of this reservation unit"),
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


class TaxPercentage(models.Model):
    value = models.DecimalField(
        verbose_name=_("Tax percentage"),
        max_digits=5,
        decimal_places=2,
        help_text="The tax percentage for a price",
    )

    def __str__(self) -> str:
        return f"{self.value}%"

    @property
    def decimal(self):
        return self.value / Decimal("100")


def get_default_tax_percentage() -> int:
    return TaxPercentage.objects.order_by("value").first().pk


class ReservationKind(models.TextChoices):
    DIRECT = "direct"
    SEASON = "season"
    DIRECT_AND_SEASON = "direct_and_season"


class PricingType(models.TextChoices):
    PAID = "paid"
    FREE = "free"


class PaymentType(models.TextChoices):
    ONLINE = "ONLINE"
    INVOICE = "INVOICE"
    ON_SITE = "ON_SITE"


class PriceUnit(models.TextChoices):
    PRICE_UNIT_PER_15_MINS = "per_15_mins", _("per 15 minutes")
    PRICE_UNIT_PER_30_MINS = "per_30_mins", _("per 30 minutes")
    PRICE_UNIT_PER_HOUR = "per_hour", _("per hour")
    PRICE_UNIT_PER_HALF_DAY = "per_half_day", _("per half a day")
    PRICE_UNIT_PER_DAY = "per_day", _("per day")
    PRICE_UNIT_PER_WEEK = "per_week", _("per week")
    PRICE_UNIT_FIXED = "fixed", _("fixed")


class PricingStatus(models.TextChoices):
    PRICING_STATUS_PAST = "past", _("past")
    PRICING_STATUS_ACTIVE = "active", _("active")
    PRICING_STATUS_FUTURE = "future", _("future")


class ReservationUnitPaymentType(models.Model):
    code = models.CharField(verbose_name=_("Code"), max_length=32, blank=False, null=False, primary_key=True)

    def __str__(self):
        return self.code


class ReservationUnitQuerySet(SearchResultsQuerySet):
    def scheduled_for_publishing(self):
        now = datetime.datetime.now(tz=get_default_timezone())
        return self.filter(
            Q(is_archived=False, is_draft=False)
            & (
                Q(publish_begins__isnull=False, publish_begins__gt=now)
                | Q(publish_ends__isnull=False, publish_ends__lte=now)
            )
        )


class ReservationUnitManager(SearchDocumentManagerMixin):
    def get_search_queryset(self, index: str = "_all") -> QuerySet:
        return self.get_queryset()


class ReservationUnit(SearchDocumentMixin, ExportModelOperationsMixin("reservation_unit"), models.Model):
    objects = ReservationUnitManager.from_queryset(ReservationUnitQuerySet)()

    sku = models.CharField(verbose_name=_("SKU"), max_length=255, blank=True, default="")
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(verbose_name=_("Description"), blank=True, default="")
    spaces = models.ManyToManyField(Space, verbose_name=_("Spaces"), related_name="reservation_units", blank=True)

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

    qualifiers = models.ManyToManyField(
        "Qualifier",
        verbose_name=_("Qualifiers"),
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
    require_introduction = models.BooleanField(verbose_name=_("Require introduction"), default=False)
    equipments = models.ManyToManyField(
        Equipment,
        verbose_name=_("Equipments"),
        blank=True,
    )
    terms_of_use = models.TextField(
        verbose_name=_("Terms of use"),
        blank=True,
        max_length=2000,
        null=True,
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
    pricing_terms = models.ForeignKey(
        TermsOfUse,
        related_name="pricing_terms_reservation_unit",
        verbose_name=_("Pricing terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    reservation_pending_instructions = models.TextField(
        verbose_name=_("Additional instructions for pending reservation"),
        blank=True,
        default="",
    )

    reservation_confirmed_instructions = models.TextField(
        verbose_name=_("Additional instructions for confirmed reservation"),
        blank=True,
        default="",
    )

    reservation_cancelled_instructions = models.TextField(
        verbose_name=_("Additional instructions for cancelled reservations"),
        blank=True,
        default="",
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

    max_persons = models.fields.PositiveIntegerField(verbose_name=_("Maximum number of persons"), null=True, blank=True)

    min_persons = models.fields.PositiveIntegerField(verbose_name=_("Minimum number of persons"), null=True, blank=True)

    surface_area = models.IntegerField(
        verbose_name=_("Surface area"),
        blank=True,
        null=True,
    )

    buffer_time_before = models.DurationField(verbose_name=_("Buffer time before reservation"), blank=True, null=True)

    buffer_time_after = models.DurationField(verbose_name=_("Buffer time after reservation"), blank=True, null=True)

    hauki_resource_id = models.CharField(verbose_name=_("Hauki resource id"), max_length=255, blank=True, null=True)

    cancellation_rule = models.ForeignKey(
        ReservationUnitCancellationRule,
        blank=True,
        null=True,
        on_delete=models.PROTECT,
    )

    RESERVATION_START_INTERVAL_15_MINUTES = "interval_15_mins"
    RESERVATION_START_INTERVAL_30_MINUTES = "interval_30_mins"
    RESERVATION_START_INTERVAL_60_MINUTES = "interval_60_mins"
    RESERVATION_START_INTERVAL_90_MINUTES = "interval_90_mins"
    RESERVATION_START_INTERVAL_CHOICES = (
        (RESERVATION_START_INTERVAL_15_MINUTES, _("15 minutes")),
        (RESERVATION_START_INTERVAL_30_MINUTES, _("30 minutes")),
        (RESERVATION_START_INTERVAL_60_MINUTES, _("60 minutes")),
        (RESERVATION_START_INTERVAL_90_MINUTES, _("90 minutes")),
    )
    reservation_start_interval = models.CharField(
        max_length=20,
        verbose_name=_("Reservation start interval"),
        choices=RESERVATION_START_INTERVAL_CHOICES,
        default=RESERVATION_START_INTERVAL_15_MINUTES,
        help_text=(
            "Determines the interval for the start time of the reservation. "
            "For example an interval of 15 minutes means a reservation can "
            "begin at minutes 15, 30, 60, or 90. Possible values are "
            f"{', '.join(value[0] for value in RESERVATION_START_INTERVAL_CHOICES)}."
        ),
    )

    reservations_max_days_before = models.PositiveIntegerField(
        verbose_name=_("Maximum number of days before reservations can be made"),
        null=True,
        blank=True,
    )

    reservations_min_days_before = models.PositiveIntegerField(
        verbose_name=_("Minimum days before reservations can be made"),
        null=True,
        blank=True,
    )

    reservation_begins = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Time when making reservations become possible for this reservation unit."),
    )
    reservation_ends = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Time when making reservations become not possible for this reservation unit"),
    )
    publish_begins = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Time after this reservation unit should be publicly visible in UI."),
    )
    publish_ends = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_("Time after this reservation unit should not be publicly visible in UI."),
    )
    metadata_set = models.ForeignKey(
        "reservations.ReservationMetadataSet",
        verbose_name=_("Reservation metadata set"),
        related_name="reservation_units",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text=_(
            "Reservation metadata set that defines the set of supported "
            "and required form fields for this reservation unit."
        ),
    )
    max_reservations_per_user = models.PositiveIntegerField(
        verbose_name=_("Maximum number of active reservations per user"),
        null=True,
        blank=True,
    )

    require_reservation_handling = models.BooleanField(
        verbose_name=_("Does the reservations of this require a handling"),
        default=False,
        blank=True,
        help_text=_("Does reservations of this reservation unit need to be handled before they're confirmed."),
    )

    AUTHENTICATION_TYPES = (("weak", _("Weak")), ("strong", _("Strong")))
    authentication = models.CharField(
        blank=False,
        verbose_name=_("Authentication"),
        max_length=20,
        choices=AUTHENTICATION_TYPES,
        default="weak",
        help_text=_("Authentication required for reserving this reservation unit."),
    )

    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be use in api sorting."),
    )

    reservation_kind = models.CharField(
        max_length=20,
        verbose_name=_("Reservation kind "),
        choices=ReservationKind.choices,
        default=ReservationKind.DIRECT_AND_SEASON,
        help_text="What kind of reservations are to be booked with this reservation unit.",
    )

    payment_types = models.ManyToManyField(ReservationUnitPaymentType, blank=True)

    can_apply_free_of_charge = models.BooleanField(
        blank=True,
        default=False,
        verbose_name=_("Can apply free of charge"),
        help_text=_("Can reservations to this reservation unit be able to apply free of charge."),
    )

    allow_reservations_without_opening_hours = models.BooleanField(
        verbose_name=_("Allow reservations without opening hours"),
        default=False,
        help_text="Is it possible to reserve this reservation unit when opening hours are not defined.",
        blank=False,
    )

    is_archived = models.BooleanField(
        verbose_name=_("Is reservation unit archived"),
        default=False,
        help_text="Is reservation unit archived.",
        blank=False,
        db_index=True,
    )

    payment_merchant = models.ForeignKey(
        PaymentMerchant,
        verbose_name=_("Payment merchant"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        help_text="Merchant used for payments",
    )

    payment_product = models.ForeignKey(
        PaymentProduct,
        verbose_name=_("Payment product"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Product used for payments",
    )

    payment_accounting = models.ForeignKey(
        PaymentAccounting,
        verbose_name=_("Payment accounting"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Payment accounting information",
    )

    class Meta:
        ordering = (
            "rank",
            "id",
        )

    def __str__(self):
        return "{}, {}".format(self.name, getattr(self.unit, "name", ""))

    def get_location(self):
        # For now, we assume that if reservation has multiple spaces they all have same location
        spaces = self.spaces.all()
        return next((space.location for space in spaces if hasattr(space, "location")), None)

    def get_building(self):
        # For now, we assume that if reservation has multiple spaces they all have same building
        spaces = self.spaces.all()
        return next((space.building for space in spaces if hasattr(space, "building")), None)

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

    def get_next_reservation(
        self,
        end_time: datetime.datetime,
        reservation=None,
        exclude_blocked: bool = False,
    ):
        from reservations.models import STATE_CHOICES, Reservation, ReservationType

        qs = Reservation.objects.filter(
            reservation_unit__in=self.reservation_units_with_same_components,
            begin__gte=end_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        if exclude_blocked:
            qs = qs.exclude(type=ReservationType.BLOCKED)

        return qs.order_by("begin").first()

    def get_previous_reservation(
        self,
        start_time: datetime.datetime,
        reservation=None,
        exclude_blocked: bool = False,
    ):
        from reservations.models import STATE_CHOICES, Reservation, ReservationType

        qs = Reservation.objects.filter(
            reservation_unit__in=self.reservation_units_with_same_components,
            end__lte=start_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        if reservation:
            qs = qs.exclude(id=reservation.id)

        if exclude_blocked:
            qs = qs.exclude(type=ReservationType.BLOCKED)

        return qs.order_by("-end").first()

    @property
    def reservation_units_with_same_components(self):
        spaces = []
        for space in self.spaces.all():
            spaces += list(space.get_family())

        return ReservationUnit.objects.filter(Q(resources__in=self.resources.all()) | Q(spaces__in=spaces)).distinct()

    @property
    def hauki_resource_origin_id(self):
        return str(self.uuid)

    @property
    def hauki_resource_data_source_id(self):
        return settings.HAUKI_ORIGIN_ID

    @property
    def state(self) -> ReservationUnitState:
        from reservation_units.utils.reservation_unit_state_helper import (
            ReservationUnitStateHelper,
        )

        return ReservationUnitStateHelper.get_state(self)

    @property
    def reservation_state(self) -> ReservationState:
        from reservation_units.utils.reservation_unit_reservation_state_helper import (
            ReservationUnitReservationStateHelper,
        )

        return ReservationUnitReservationStateHelper.get_state(self)

    def save(self, *args, **kwargs) -> None:
        super().save(*args, **kwargs)
        if settings.UPDATE_PRODUCT_MAPPING:
            refresh_reservation_unit_product_mapping.delay(self.pk)

    # ElasticSearch
    def as_search_document(self, *, index: str) -> dict | None:
        if index == "reservation_units":
            return {
                "pk": self.pk,
                "name_fi": self.name_fi,
                "name_en": self.name_en,
                "name_sv": self.name_sv,
                "description_fi": self.description_fi,
                "description_en": self.description_en,
                "description_sv": self.description_sv,
                "space_name_fi": ",".join([s.name_fi or "" for s in self.spaces.all()]),
                "space_name_en": ",".join([s.name_en or "" for s in self.spaces.all()]),
                "space_name_sv": ",".join([s.name_sv or "" for s in self.spaces.all()]),
                "keyword_groups_name_fi": ",".join([k.name_fi or "" for k in self.keyword_groups.all()]),
                "keyword_groups_en": ",".join([k.name_e or "" for k in self.keyword_groups.all()]),
                "keyword_groups_sv": ",".join([k.name_sv or "" for k in self.keyword_groups.all()]),
                "resources_name_fi": ",".join([r.name_fi for r in self.resources.all()]),
                "resources_name_en": ",".join([r.name_en or "" for r in self.resources.all()]),
                "resources_name_sv": ",".join([r.name_sv or "" for r in self.resources.all()]),
                "services_name_fi": ",".join([s.name_fi or "" for s in self.services.all()]),
                "services_name_en": ",".join([s.name_en or "" for s in self.services.all()]),
                "services_name_sv": ",".join([s.name_sv or "" for s in self.services.all()]),
                "purposes_name_fi": ",".join([p.name_fi or "" for p in self.purposes.all()]),
                "purposes_name_en": ",".join([p.name_en or "" for p in self.purposes.all()]),
                "purposes_name_sv": ",".join([p.name_sv or "" for p in self.purposes.all()]),
                "reservation_unit_type_name_fi": getattr(self.reservation_unit_type, "name_fi", ""),
                "reservation_unit_type_name_en": getattr(self.reservation_unit_type, "name_en", ""),
                "reservation_unit_type_name_sv": getattr(self.reservation_unit_type, "name_sv", ""),
                "equipments_name_fi": ",".join([e.name_fi or "" for e in self.equipments.all()]),
                "equipments_name_en": ",".join([e.name_en or "" for e in self.equipments.all()]),
                "equipments_name_sv": ",".join([e.name_sv or "" for e in self.equipments.all()]),
                "unit_name_fi": getattr(self.unit, "name_fi", ""),
                "unit_name_en": getattr(self.unit, "name_en", ""),
                "unit_name_sv": getattr(self.unit, "name_sv", ""),
            }

        return None


class ReservationUnitPricingManager(models.QuerySet):
    def active(self):
        return self.filter(status=PricingStatus.PRICING_STATUS_ACTIVE).first()


class ReservationUnitPricing(models.Model):
    objects = ReservationUnitPricingManager.as_manager()

    begins = models.DateField(
        verbose_name=_("Date when price is activated"),
        null=False,
        blank=False,
        help_text="When pricing is activated",
    )

    pricing_type = models.CharField(
        max_length=20,
        verbose_name=_("Pricing type"),
        choices=PricingType.choices,
        blank=True,
        null=True,
        help_text="What kind of pricing types are available with this reservation unit.",
    )

    price_unit = models.CharField(
        max_length=20,
        verbose_name=_("Price unit"),
        choices=PriceUnit.choices,
        default=PriceUnit.PRICE_UNIT_PER_HOUR,
        help_text="Unit of the price",
    )
    lowest_price = models.DecimalField(
        verbose_name=_("Lowest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Minimum price of the reservation unit including VAT",
    )

    lowest_price_net = models.DecimalField(
        verbose_name=_("Lowest net price"),
        max_digits=20,
        decimal_places=6,
        default=0,
        help_text="Minimum price of the reservation unit excluding VAT",
    )

    highest_price = models.DecimalField(
        verbose_name=_("Highest price"),
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Maximum price of the reservation unit including VAT",
    )

    highest_price_net = models.DecimalField(
        verbose_name=_("Highest net price"),
        max_digits=20,
        decimal_places=6,
        default=0,
        help_text="Maximum price of the reservation unit excluding VAT",
    )

    tax_percentage = models.ForeignKey(
        TaxPercentage,
        verbose_name=_("Tax percentage"),
        related_name="reservation_unit_pricings",
        on_delete=models.PROTECT,
        default=get_default_tax_percentage,
        help_text="The percentage of tax included in the price",
    )

    status = models.CharField(
        max_length=20,
        verbose_name=_("Status"),
        choices=PricingStatus.choices,
        help_text="Status of the pricing",
    )

    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        null=True,
        blank=False,
        related_name="pricings",
        on_delete=models.CASCADE,
    )

    def __str__(self) -> str:
        return f"{self.begins}: {self.lowest_price} - {self.highest_price} ({self.tax_percentage.value})"


class PurgeImageCacheMixin:
    def purge_previous_image_cache(self):
        previous_data = self.__class__.objects.filter(pk=self.pk).first()
        if settings.IMAGE_CACHE_ENABLED and previous_data and previous_data.image:
            aliases = settings.THUMBNAIL_ALIASES[""]
            for conf_key in list(aliases.keys()):
                image_path = get_thumbnailer(previous_data.image)[conf_key].url
                purge_image_cache.delay(image_path)


class ReservationUnitImage(models.Model, PurgeImageCacheMixin):
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

    large_url = models.URLField(null=False, blank=True, max_length=255, default="")
    medium_url = models.URLField(null=False, blank=True, max_length=255, default="")
    small_url = models.URLField(null=False, blank=True, max_length=255, default="")

    def __str__(self):
        return f"{self.reservation_unit.name} ({self.get_image_type_display()})"

    def save(
        self,
        force_insert=False,
        force_update=False,
        using=None,
        update_fields=None,
        update_urls=True,
    ):
        self.purge_previous_image_cache()

        super().save(force_insert=force_insert, force_update=force_update, using=using, update_fields=update_fields)

        if update_urls:
            self.update_image_urls()

    def update_image_urls(self):
        update_urls.delay(self.pk)


class Purpose(models.Model, PurgeImageCacheMixin):
    name = models.CharField(max_length=200)

    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT, null=True)

    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

    class Meta:
        ordering = ["rank"]

    def save(self, *args, **kwargs) -> None:
        self.purge_previous_image_cache()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Qualifier(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self) -> str:
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

    name = models.CharField(max_length=200, verbose_name=_("Name"), blank=True, default="")
    description = models.CharField(verbose_name=_("Description"), null=True, blank=True, max_length=500)
    closed = models.BooleanField(verbose_name=_("Closed"), default=False, editable=False)

    def __str__(self):
        return f"{self.reservation_unit.name}({self.start} - {self.end})"


class Day(models.Model):
    """
    Day of week and its active start and end time and whether it is open or closed

    Kirjastot.fi API uses closed for both days and periods, don't know which takes precedence
    """

    period = models.ForeignKey(
        Period,
        verbose_name=_("Period"),
        db_index=True,
        related_name="days",
        on_delete=models.CASCADE,
    )
    weekday = models.IntegerField(verbose_name=_("Weekday"), choices=WEEKDAYS.CHOICES)
    opens = models.TimeField(verbose_name=_("Time when opens"), null=True, blank=True)
    closes = models.TimeField(verbose_name=_("Time when closes"), null=True, blank=True)

    def __str__(self):
        return f"{self.get_weekday_display()}({self.period.reservation_unit.name})"


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
    begin = models.TimeField(verbose_name=_("Begin time of day part"), null=True, blank=True)
    end = models.TimeField(verbose_name=_("End time of day part"), null=True, blank=True)
    day = models.ForeignKey(Day, verbose_name=_("Day"), on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.day.period.reservation_unit.name} {self.day.get_weekday_display()} ({self.begin}-{self.end})"


class Introduction(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    reservation_unit = models.ForeignKey(ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.CASCADE)

    completed_at = models.DateTimeField(verbose_name=_("Completed at"))


AuditLogger.register(ReservationUnit)
AuditLogger.register(ReservationUnitPricing)
