from __future__ import annotations

import datetime
import uuid
from functools import cached_property
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from elasticsearch_django.models import SearchDocumentMixin
from lookup_property import L, lookup_property

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import (
    AuthenticationType,
    ReservationKind,
    ReservationStartInterval,
    ReservationUnitPublishingState,
    ReservationUnitReservationState,
)
from utils.db import NowTT

from .queryset import ReservationUnitManager

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.models import (
        OriginHaukiResource,
        PaymentAccounting,
        PaymentMerchant,
        PaymentProduct,
        ReservationMetadataSet,
        ReservationUnitCancellationRule,
        ReservationUnitType,
        TermsOfUse,
        Unit,
    )

    from .actions import ReservationUnitActions


__all__ = [
    "ReservationUnit",
]


class ReservationUnit(SearchDocumentMixin, models.Model):
    # IDs

    sku: str = models.CharField(max_length=255, blank=True, default="")
    uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

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
    min_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    max_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    max_reservations_per_user: int | None = models.PositiveIntegerField(null=True, blank=True)
    # In calculations this is interpreted as the beginning of the calculated day.
    # e.g. Today is 2023-10-10
    # min_days_before = 1, earliest reservation that can be made is 2023-10-11 00:00
    # min_days_before = 2, earliest reservation that can be made is 2023-10-12 00:00
    reservations_min_days_before: int | None = models.PositiveIntegerField(null=True, blank=True)
    # The latest reservation that can be made is calculated as now + max_days_before. No time interpretation made.
    reservations_max_days_before: int | None = models.PositiveIntegerField(null=True, blank=True)

    # Datetime

    reservation_begins: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    reservation_ends: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    publish_begins: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    publish_ends: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
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
        db_index=True,
    )

    # Many-to-One related

    unit: Unit | None = models.ForeignKey(
        "tilavarauspalvelu.Unit",
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    origin_hauki_resource: OriginHaukiResource | None = models.ForeignKey(
        "tilavarauspalvelu.OriginHaukiResource",
        related_name="reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    reservation_unit_type: ReservationUnitType | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnitType",
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    cancellation_rule: ReservationUnitCancellationRule | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnitCancellationRule",
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.PROTECT,
    )
    metadata_set: ReservationMetadataSet | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationMetadataSet",
        related_name="reservation_units",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    cancellation_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="cancellation_terms_reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    service_specific_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="service_specific_terms_reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    pricing_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="pricing_terms_reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    payment_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="payment_terms_reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    payment_product: PaymentProduct | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentProduct",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    payment_merchant: PaymentMerchant | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentMerchant",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    payment_accounting: PaymentAccounting | None = models.ForeignKey(
        "tilavarauspalvelu.PaymentAccounting",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Many-to-Many related

    spaces = models.ManyToManyField(
        "tilavarauspalvelu.Space",
        related_name="reservation_units",
        blank=True,
    )
    resources = models.ManyToManyField(
        "tilavarauspalvelu.Resource",
        related_name="reservation_units",
        blank=True,
    )
    purposes = models.ManyToManyField(
        "tilavarauspalvelu.Purpose",
        related_name="reservation_units",
        blank=True,
    )
    equipments = models.ManyToManyField(
        "tilavarauspalvelu.Equipment",
        related_name="reservation_units",
        blank=True,
    )
    services = models.ManyToManyField(
        "tilavarauspalvelu.Service",
        related_name="reservation_units",
        blank=True,
    )
    payment_types = models.ManyToManyField(
        "tilavarauspalvelu.ReservationUnitPaymentType",
        related_name="reservation_units",
        blank=True,
    )
    qualifiers = models.ManyToManyField(  # Deprecated
        "tilavarauspalvelu.Qualifier",
        related_name="reservation_units",
        blank=True,
    )
    keyword_groups = models.ManyToManyField(  # Deprecated
        "tilavarauspalvelu.KeywordGroup",
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

    class Meta:
        db_table = "reservation_unit"
        base_manager_name = "objects"
        verbose_name = _("reservation unit")
        verbose_name_plural = _("reservation units")
        ordering = ["rank", "id"]

    def __str__(self) -> str:
        return f"{self.name}, {getattr(self.unit, 'name', '')}"

    @cached_property
    def actions(self) -> ReservationUnitActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitActions

        return ReservationUnitActions(self)

    @lookup_property(skip_codegen=True)
    def active_pricing_price() -> Decimal | None:
        """Get the pricing type from the currently active pricing."""
        from tilavarauspalvelu.models import ReservationUnitPricing

        return models.Subquery(  # type: ignore[return-value]
            queryset=(
                ReservationUnitPricing.objects.filter(reservation_unit=models.OuterRef("pk"))
                .active()
                .values("highest_price")[:1]
            ),
            output_field=models.CharField(null=True),
        )

    @active_pricing_price.override
    def _(self) -> Decimal | None:
        return self.pricings.active().values_list("highest_price", flat=True).first()

    @lookup_property
    def publishing_state() -> str:
        """State indicating the publishing status of the reservation unit."""
        case = models.Case(
            # Reservation Unit has been archived.
            models.When(
                models.Q(is_archived=True),
                then=models.Value(ReservationUnitPublishingState.ARCHIVED.value),
            ),
            # Reservation Unit is still a draft.
            models.When(
                models.Q(is_draft=True),
                then=models.Value(ReservationUnitPublishingState.DRAFT.value),
            ),
            # Reservation Unit is going to be published, but has not been set to unpublish in the future.
            models.When(
                (
                    # Publishes in the future.
                    models.Q(publish_begins__isnull=False)
                    & models.Q(publish_begins__gt=NowTT())
                    & (
                        # Does not unpublish.
                        models.Q(publish_ends__isnull=True)
                        # Was previously unpublished.
                        | models.Q(publish_ends__lte=NowTT())
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.SCHEDULED_PUBLISHING.value),
            ),
            # Reservation Unit is currently unpublished and is not going to be published in the future.
            models.When(
                (
                    (
                        # Is unpublished.
                        models.Q(publish_ends__isnull=False)
                        & models.Q(publish_ends__lte=NowTT())
                        & (
                            # Was previously always published.
                            models.Q(publish_begins__isnull=True)
                            # Was previously published, but before it was unpublished.
                            | (
                                models.Q(publish_begins__lte=NowTT())  #
                                & models.Q(publish_begins__lte=models.F("publish_ends"))
                            )
                        )
                    )
                    | (
                        # Publishes and unpublishes at the exact same time.
                        models.Q(publish_begins__isnull=False)
                        & models.Q(publish_ends__isnull=False)
                        & models.Q(publish_begins=models.F("publish_ends"))
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.HIDDEN.value),
            ),
            # Reservation Unit is currently published, but is going to unpublish in the future.
            # It might be set to become published again in the future, but after it first unpublishes.
            models.When(
                (
                    # Unpublishes in the future.
                    models.Q(publish_ends__isnull=False)
                    & models.Q(publish_ends__gt=NowTT())
                    & (
                        # Was always published.
                        models.Q(publish_begins__isnull=True)
                        # Was published in the past.
                        | models.Q(publish_begins__lte=NowTT())
                        # Publishing begins again in the future, but after it first unpublishes.
                        | models.Q(publish_begins__gt=models.F("publish_ends"))
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.SCHEDULED_HIDING.value),
            ),
            # Reservation Unit has not been published, but is going to be published,
            # and then unpublished in the future.
            models.When(
                (
                    # Publishes in the future.
                    models.Q(publish_begins__isnull=False)
                    & models.Q(publish_begins__gt=NowTT())
                    # Unpublishes in the future.
                    & models.Q(publish_ends__isnull=False)
                    & models.Q(publish_ends__gt=NowTT())
                    # Publishes before it unpublishes.
                    & models.Q(publish_begins__lt=models.F("publish_ends"))
                ),
                then=models.Value(ReservationUnitPublishingState.SCHEDULED_PERIOD.value),
            ),
            # Otherwise, Reservation Unit is published.
            default=models.Value(ReservationUnitPublishingState.PUBLISHED.value),
            output_field=models.CharField(),
        )
        return case  # type: ignore[return-value]  # noqa: RET504

    @lookup_property
    def reservation_state() -> ReservationUnitReservationState:
        case = models.Case(
            # Reservation Unit is currently not reservable, but will be in the future.
            models.When(
                (
                    # Reservation period begins in the future.
                    models.Q(reservation_begins__isnull=False)
                    & models.Q(reservation_begins__gt=NowTT())
                    & (
                        # No previous reservation period.
                        models.Q(reservation_ends__isnull=True)
                        # Previous reservation period ended in the past.
                        | models.Q(reservation_ends__lte=NowTT())
                    )
                ),
                then=models.Value(ReservationUnitReservationState.SCHEDULED_RESERVATION.value),
            ),
            # Reservation Unit is currently not reservable, but will be in the future for a specific period.
            models.When(
                (
                    # Reservation period begins in the future.
                    models.Q(reservation_begins__isnull=False)
                    & models.Q(reservation_begins__gt=NowTT())
                    # Reservation period ends in the future
                    & models.Q(reservation_ends__isnull=False)
                    & models.Q(reservation_ends__gt=NowTT())
                    # Reservation period begins before it ends.
                    & models.Q(reservation_begins__lt=models.F("reservation_ends"))
                ),
                then=models.Value(ReservationUnitReservationState.SCHEDULED_PERIOD.value),
            ),
            # Reservation Unit doesn't have an active pricing,
            #  OR it has a paid pricing with no payment product,
            #  OR it was reservable in the past (but not anymore),
            #  OR reservation period is zero-length.
            models.When(
                (
                    # No active pricing.
                    L(active_pricing_price=None)
                    | (
                        # Paid pricing with no payment product.
                        L(active_pricing_price__gt=0) & models.Q(payment_product__isnull=True)
                        # When using Mock Verkkokauppa API, pricing is valid even if there is no payment product.
                        if not settings.MOCK_VERKKOKAUPPA_API_ENABLED
                        else ~models.Q()  # Evaluates to False
                    )
                    | (
                        # Reservation period ended now or in the past.
                        models.Q(reservation_ends__isnull=False)
                        & models.Q(reservation_ends__lte=NowTT())
                        & (
                            # Reservation period was previously open.
                            models.Q(reservation_begins__isnull=True)
                            # Reservation period begun before it ended.
                            | (
                                models.Q(reservation_begins__isnull=False)
                                & models.Q(reservation_begins__lt=models.F("reservation_ends"))
                            )
                        )
                    )
                    | (
                        # Reservation period begins and ends at the exact same time.
                        models.Q(reservation_begins__isnull=False)
                        & models.Q(reservation_ends__isnull=False)
                        & models.Q(reservation_ends=models.F("reservation_begins"))
                    )
                ),
                then=models.Value(ReservationUnitReservationState.RESERVATION_CLOSED.value),
            ),
            # Reservation Unit is currently reservable, but will be closed in the future.
            # It might be set to become reservable again in the future, but after it first closes.
            models.When(
                (
                    # Reservation period ends in the future.
                    models.Q(reservation_ends__isnull=False)
                    & models.Q(reservation_ends__gt=NowTT())
                    & (
                        # Reservation period has never been closed.
                        models.Q(reservation_begins__isnull=True)
                        # Reservation period has begun in the past.
                        | models.Q(reservation_begins__lte=NowTT())
                        # Reservation period has begins again in the future, but after it first ends.
                        | models.Q(reservation_begins__gt=models.F("reservation_ends"))
                    )
                ),
                then=models.Value(ReservationUnitReservationState.SCHEDULED_CLOSING.value),
            ),
            # Otherwise, Reservation Unit is reservable
            default=models.Value(ReservationUnitReservationState.RESERVABLE.value),
            output_field=models.CharField(),
        )

        return case  # type: ignore[return-value]  # noqa: RET504

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


AuditLogger.register(
    ReservationUnit,
    # Exclude lookup properties, since they are calculated values.
    exclude_fields=[
        "_publishing_state",
        "_reservation_state",
        "_active_pricing_price",
    ],
)
