from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from elasticsearch_django.models import SearchDocumentManagerMixin, SearchDocumentMixin

from common.connectors import ReservationUnitActionsConnector
from reservation_units.enums import (
    AuthenticationType,
    ReservationKind,
    ReservationStartInterval,
    ReservationState,
    ReservationUnitState,
)
from reservation_units.querysets import ReservationUnitQuerySet
from reservation_units.tasks import refresh_reservation_unit_product_mapping
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

if TYPE_CHECKING:
    from merchants.models import PaymentAccounting, PaymentMerchant, PaymentProduct
    from opening_hours.models import OriginHaukiResource
    from reservation_units.models import ReservationUnitCancellationRule, ReservationUnitType
    from reservations.models import ReservationMetadataSet
    from spaces.models import Unit
    from terms_of_use.models import TermsOfUse


__all__ = [
    "ReservationUnit",
]


class ReservationUnitManager(SearchDocumentManagerMixin.from_queryset(ReservationUnitQuerySet)):
    def get_search_queryset(self, index: str = "_all") -> models.QuerySet:
        return self.get_queryset()


class ReservationUnit(SearchDocumentMixin, models.Model):
    # IDs

    sku: str = models.CharField(max_length=255, blank=True, default="")
    uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    rank: int | None = models.PositiveIntegerField(null=True, blank=True)

    # Strings

    name: str = models.CharField(max_length=255)
    description: str = models.TextField(blank=True, default="")
    contact_information: str = models.TextField(blank=True, default="")
    terms_of_use: str | None = models.TextField(null=True, blank=True, max_length=2000)
    reservation_pending_instructions: str = models.TextField(blank=True, default="")
    reservation_confirmed_instructions: str = models.TextField(blank=True, default="")
    reservation_cancelled_instructions: str = models.TextField(blank=True, default="")

    # Integers

    surface_area: int | None = models.IntegerField(null=True, blank=True)
    min_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)
    max_persons: int | None = models.fields.PositiveIntegerField(null=True, blank=True)
    max_reservations_per_user: int | None = models.PositiveIntegerField(null=True, blank=True)
    # In calculations this is interpreted as the beginning of the calculated day.
    # e.g. current_date = 2023-10-10
    # min_days_before = 1, earliest reservation that can be made is 2023-10-11 00:00
    # min_days_before = 2, earliest reservation that can be made is 2023-10-12 00:00
    reservations_min_days_before: int | None = models.PositiveIntegerField(null=True, blank=True)
    # The latest reservation that can be made is calculated as now + max_days_before. No time interpretation made.
    reservations_max_days_before: int | None = models.PositiveIntegerField(null=True, blank=True)

    # Datetime

    reservation_begins: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    reservation_ends: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    publish_begins: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    publish_ends: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    min_reservation_duration: datetime.timedelta | None = models.DurationField(null=True, blank=True)
    max_reservation_duration: datetime.timedelta | None = models.DurationField(null=True, blank=True)
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)

    # Booleans

    is_draft: bool = models.BooleanField(default=False, blank=True, db_index=True)
    is_archived: bool = models.BooleanField(default=False, db_index=True)
    require_introduction: bool = models.BooleanField(default=False)
    require_reservation_handling: bool = models.BooleanField(default=False, blank=True)
    reservation_block_whole_day: bool = models.BooleanField(default=False, blank=True)
    can_apply_free_of_charge: bool = models.BooleanField(default=False, blank=True)
    allow_reservations_without_opening_hours: bool = models.BooleanField(default=False)

    # Enums

    authentication: str = models.CharField(
        max_length=20,
        choices=AuthenticationType.choices,
        default=AuthenticationType.WEAK.value,
    )
    reservation_start_interval: str = models.CharField(
        max_length=20,
        choices=ReservationStartInterval.choices,
        default=ReservationStartInterval.INTERVAL_15_MINUTES.value,
    )
    reservation_kind: str = models.CharField(
        max_length=20,
        choices=ReservationKind.choices,
        default=ReservationKind.DIRECT_AND_SEASON.value,
    )

    # Many-to-One related

    unit: Unit | None = models.ForeignKey(
        "spaces.Unit",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    origin_hauki_resource: OriginHaukiResource | None = models.ForeignKey(
        "opening_hours.OriginHaukiResource",
        related_name="reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    reservation_unit_type: ReservationUnitType | None = models.ForeignKey(
        "reservation_units.ReservationUnitType",
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    cancellation_rule: ReservationUnitCancellationRule | None = models.ForeignKey(
        "reservation_units.ReservationUnitCancellationRule",
        blank=True,
        null=True,
        on_delete=models.PROTECT,
    )
    metadata_set: ReservationMetadataSet | None = models.ForeignKey(
        "reservations.ReservationMetadataSet",
        related_name="reservation_units",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    cancellation_terms: TermsOfUse | None = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="cancellation_terms_reservation_unit",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    service_specific_terms: TermsOfUse | None = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="service_specific_terms_reservation_unit",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    pricing_terms: TermsOfUse | None = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="pricing_terms_reservation_unit",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    payment_terms: TermsOfUse | None = models.ForeignKey(
        "terms_of_use.TermsOfUse",
        related_name="payment_terms_reservation_unit",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    payment_product: PaymentProduct | None = models.ForeignKey(
        "merchants.PaymentProduct",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    payment_merchant: PaymentMerchant | None = models.ForeignKey(
        "merchants.PaymentMerchant",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    payment_accounting: PaymentAccounting | None = models.ForeignKey(
        "merchants.PaymentAccounting",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Many-to-Many related

    spaces = models.ManyToManyField(
        "spaces.Space",
        related_name="reservation_units",
        blank=True,
    )
    resources = models.ManyToManyField(
        "resources.Resource",
        related_name="reservation_units",
        blank=True,
    )
    purposes = models.ManyToManyField(
        "reservation_units.Purpose",
        related_name="reservation_units",
        blank=True,
    )
    equipments = models.ManyToManyField(
        "reservation_units.Equipment",
        blank=True,
    )
    services = models.ManyToManyField(
        "services.Service",
        related_name="reservation_units",
        blank=True,
    )
    payment_types = models.ManyToManyField(
        "reservation_units.ReservationUnitPaymentType",
        blank=True,
    )
    qualifiers = models.ManyToManyField(  # Deprecated
        "reservation_units.Qualifier",
        related_name="reservation_units",
        blank=True,
    )
    keyword_groups = models.ManyToManyField(  # Deprecated
        "reservation_units.KeywordGroup",
        related_name="reservation_units",
        blank=True,
    )

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

    objects = ReservationUnitManager()
    actions = ReservationUnitActionsConnector()

    class Meta:
        db_table = "reservation_unit"
        base_manager_name = "objects"
        verbose_name = _("Reservation Unit")
        verbose_name_plural = _("Reservation Units")
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
