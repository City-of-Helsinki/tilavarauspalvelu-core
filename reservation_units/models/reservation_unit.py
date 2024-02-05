from __future__ import annotations

import datetime
import uuid
from typing import Any

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_prometheus.models import ExportModelOperationsMixin
from elasticsearch_django.models import SearchDocumentManagerMixin, SearchDocumentMixin

from common.connectors import ReservationUnitActionsConnector
from reservation_units.enums import ReservationKind, ReservationStartInterval, ReservationState, ReservationUnitState
from reservation_units.querysets import ReservationUnitQuerySet
from reservation_units.tasks import refresh_reservation_unit_product_mapping
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

__all__ = [
    "ReservationUnit",
]


class ReservationUnitManager(SearchDocumentManagerMixin.from_queryset(ReservationUnitQuerySet)):
    def get_search_queryset(self, index: str = "_all") -> models.QuerySet:
        return self.get_queryset()


class ReservationUnit(SearchDocumentMixin, ExportModelOperationsMixin("reservation_unit"), models.Model):
    sku = models.CharField(verbose_name=_("SKU"), max_length=255, blank=True, default="")
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(verbose_name=_("Description"), blank=True, default="")
    spaces = models.ManyToManyField(
        "spaces.Space",
        verbose_name=_("Spaces"),
        related_name="reservation_units",
        blank=True,
    )

    keyword_groups = models.ManyToManyField(
        "reservation_units.KeywordGroup",
        verbose_name=_("Keyword groups"),
        related_name="reservation_units",
        blank=True,
    )

    resources = models.ManyToManyField(
        "resources.Resource",
        verbose_name=_("Resources"),
        related_name="reservation_units",
        blank=True,
    )
    services = models.ManyToManyField(
        "services.Service",
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
        "reservation_units.ReservationUnitType",
        verbose_name=_("Type"),
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    require_introduction = models.BooleanField(verbose_name=_("Require introduction"), default=False)
    equipments = models.ManyToManyField(
        "reservation_units.Equipment",
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
        "terms_of_use.TermsOfUse",
        related_name="payment_terms_reservation_unit",
        verbose_name=_("Payment terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    cancellation_terms = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="cancellation_terms_reservation_unit",
        verbose_name=_("Cancellation terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    service_specific_terms = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="service_specific_terms_reservation_unit",
        verbose_name=_("Service-specific terms"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    pricing_terms = models.ForeignKey(
        "terms_of_use.TermsOfUse",
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
        "spaces.Unit",
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

    buffer_time_before: datetime.timedelta = models.DurationField(
        verbose_name=_("Buffer time before reservation"),
        default=datetime.timedelta(),
        blank=True,
    )

    buffer_time_after: datetime.timedelta = models.DurationField(
        verbose_name=_("Buffer time after reservation"),
        default=datetime.timedelta(),
        blank=True,
    )

    origin_hauki_resource = models.ForeignKey(
        "opening_hours.OriginHaukiResource",
        related_name="reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    cancellation_rule = models.ForeignKey(
        "reservation_units.ReservationUnitCancellationRule",
        blank=True,
        null=True,
        on_delete=models.PROTECT,
    )

    reservation_start_interval: str = models.CharField(
        max_length=20,
        verbose_name=_("Reservation start interval"),
        choices=ReservationStartInterval.choices,
        default=ReservationStartInterval.INTERVAL_15_MINUTES.value,
        help_text=(
            "Determines the interval for the start time of the reservation. "
            "For example an interval of 15 minutes means a reservation can "
            "begin at minutes 15, 30, 60, or 90. Possible values are "
            f"{', '.join(values for values in ReservationStartInterval.values)}."
        ),
    )

    # In calculations this is interpreted as the beginning of the calculated day.
    # e.g. current_date = 2023-10-10
    # min_days_before = 1, earliest reservation that can be made is 2023-10-11 00:00
    # min_days_before = 2, earliest reservation that can be made is 2023-10-12 00:00
    reservations_min_days_before = models.PositiveIntegerField(
        verbose_name=_("Minimum days before reservations can be made"),
        null=True,
        blank=True,
    )

    # The latest reservation that can be made is calculated as now + max_days_before. No time interpretation made.
    reservations_max_days_before = models.PositiveIntegerField(
        verbose_name=_("Maximum number of days before reservations can be made"),
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

    payment_types = models.ManyToManyField("reservation_units.ReservationUnitPaymentType", blank=True)

    reservation_block_whole_day = models.BooleanField(blank=True, default=False)

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
        "merchants.PaymentMerchant",
        verbose_name=_("Payment merchant"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
        help_text="Merchant used for payments",
    )

    payment_product = models.ForeignKey(
        "merchants.PaymentProduct",
        verbose_name=_("Payment product"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Product used for payments",
    )

    payment_accounting = models.ForeignKey(
        "merchants.PaymentAccounting",
        verbose_name=_("Payment accounting"),
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Payment accounting information",
    )

    objects = ReservationUnitManager()
    actions = ReservationUnitActionsConnector()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None
    description_fi: str | None
    description_sv: str | None
    description_en: str | None
    terms_of_use_fi: str | None
    terms_of_use_sv: str | None
    terms_of_use_en: str | None
    reservation_pending_instructions_fi: str | None
    reservation_pending_instructions_sv: str | None
    reservation_pending_instructions_en: str | None
    reservation_confirmed_instructions_fi: str | None
    reservation_confirmed_instructions_sv: str | None
    reservation_confirmed_instructions_en: str | None
    reservation_cancelled_instructions_fi: str | None
    reservation_cancelled_instructions_sv: str | None
    reservation_cancelled_instructions_en: str | None

    class Meta:
        db_table = "reservation_unit"
        base_manager_name = "objects"
        ordering = ["rank", "id"]

    def __str__(self) -> str:
        return f"{self.name}, {getattr(self.unit, 'name', '')}"

    def save(self, *args: Any, **kwargs: Any) -> None:
        super().save(*args, **kwargs)
        if settings.UPDATE_PRODUCT_MAPPING:
            refresh_reservation_unit_product_mapping.delay(self.pk)

    @property
    def state(self) -> ReservationUnitState:
        from reservation_units.utils.reservation_unit_state_helper import ReservationUnitStateHelper

        return ReservationUnitStateHelper.get_state(self)

    @property
    def reservation_state(self) -> ReservationState:
        from reservation_units.utils.reservation_unit_reservation_state_helper import (
            ReservationUnitReservationStateHelper,
        )

        return ReservationUnitReservationStateHelper.get_state(self)

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


AuditLogger.register(ReservationUnit)
