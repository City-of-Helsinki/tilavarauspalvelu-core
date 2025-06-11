from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.db.models import Subquery
from django.utils.translation import gettext_lazy as _
from lookup_property import L, lookup_property

from config.utils.auditlog_util import AuditLogger
from tilavarauspalvelu.enums import (
    AuthenticationType,
    ReservationFormType,
    ReservationKind,
    ReservationStartInterval,
    ReservationUnitPublishingState,
    ReservationUnitReservationState,
)
from utils.db import NowTT
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from decimal import Decimal

    from tilavarauspalvelu.enums import AccessType
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
    from .queryset import ReservationUnitManager
    from .validators import ReservationUnitValidator


__all__ = [
    "ReservationUnit",
]


class ReservationUnit(models.Model):
    # IDs

    ext_uuid: uuid.UUID = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)  # ID for external systems
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    # Strings

    name: str = models.CharField(max_length=255)
    description: str = models.TextField(blank=True, default="")
    contact_information: str = models.TextField(blank=True, default="")
    notes_when_applying: str | None = models.TextField(null=True, blank=True, max_length=2000)
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

    reservation_begins_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    reservation_ends_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    publish_begins_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    publish_ends_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True, db_index=True)
    min_reservation_duration: datetime.timedelta | None = models.DurationField(null=True, blank=True)
    max_reservation_duration: datetime.timedelta | None = models.DurationField(null=True, blank=True)
    buffer_time_before: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    buffer_time_after: datetime.timedelta = models.DurationField(default=datetime.timedelta(), blank=True)
    updated_at: datetime.datetime = models.DateTimeField(auto_now=True, db_index=True)

    # Booleans

    is_draft: bool = models.BooleanField(default=False, blank=True, db_index=True)
    is_archived: bool = models.BooleanField(default=False, db_index=True)
    require_adult_reservee: bool = models.BooleanField(default=False, blank=True)
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
    reservation_form: str = models.CharField(
        max_length=255,
        choices=ReservationFormType.choices,
        default=ReservationFormType.CONTACT_INFO_FORM.value,
        db_index=True,
    )

    # List fields

    search_terms = ArrayField(models.CharField(max_length=255), blank=True, default=list)

    # Many-to-One related

    unit: Unit = models.ForeignKey(
        "tilavarauspalvelu.Unit",
        related_name="reservation_units",
        on_delete=models.PROTECT,
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
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    cancellation_rule: ReservationUnitCancellationRule | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnitCancellationRule",
        related_name="reservation_units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )
    metadata_set: ReservationMetadataSet | None = models.ForeignKey(
        "tilavarauspalvelu.ReservationMetadataSet",
        related_name="reservation_units",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    cancellation_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="cancellation_terms_reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    service_specific_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="service_specific_terms_reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    pricing_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="pricing_terms_reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    payment_terms: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="payment_terms_reservation_units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
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

    # Pre-calculated search vectors.

    search_vector_fi = SearchVectorField()
    search_vector_en = SearchVectorField()
    search_vector_sv = SearchVectorField()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None
    description_fi: str | None
    description_sv: str | None
    description_en: str | None
    notes_when_applying_fi: str | None
    notes_when_applying_sv: str | None
    notes_when_applying_en: str | None
    reservation_pending_instructions_fi: str | None
    reservation_pending_instructions_sv: str | None
    reservation_pending_instructions_en: str | None
    reservation_confirmed_instructions_fi: str | None
    reservation_confirmed_instructions_sv: str | None
    reservation_confirmed_instructions_en: str | None
    reservation_cancelled_instructions_fi: str | None
    reservation_cancelled_instructions_sv: str | None
    reservation_cancelled_instructions_en: str | None

    objects: ClassVar[ReservationUnitManager] = LazyModelManager.new()
    actions: ReservationUnitActions = LazyModelAttribute.new()
    validators: ReservationUnitValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit"
        base_manager_name = "objects"
        verbose_name = _("reservation unit")
        verbose_name_plural = _("reservation units")
        ordering = ["rank", "id"]

    def __str__(self) -> str:
        return f"{self.name}, {getattr(self.unit, 'name', '')}"

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
    def publishing_state() -> ReservationUnitPublishingState:
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
                    models.Q(publish_begins_at__isnull=False)
                    & models.Q(publish_begins_at__gt=NowTT())
                    & (
                        # Does not unpublish.
                        models.Q(publish_ends_at__isnull=True)
                        # Was previously unpublished.
                        | models.Q(publish_ends_at__lte=NowTT())
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.SCHEDULED_PUBLISHING.value),
            ),
            # Reservation Unit is currently unpublished and is not going to be published in the future.
            models.When(
                (
                    (
                        # Is unpublished.
                        models.Q(publish_ends_at__isnull=False)
                        & models.Q(publish_ends_at__lte=NowTT())
                        & (
                            # Was previously always published.
                            models.Q(publish_begins_at__isnull=True)
                            # Was previously published, but before it was unpublished.
                            | (
                                models.Q(publish_begins_at__lte=NowTT())  #
                                & models.Q(publish_begins_at__lte=models.F("publish_ends_at"))
                            )
                        )
                    )
                    | (
                        # Publishes and unpublishes at the exact same time.
                        models.Q(publish_begins_at__isnull=False)
                        & models.Q(publish_ends_at__isnull=False)
                        & models.Q(publish_begins_at=models.F("publish_ends_at"))
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.HIDDEN.value),
            ),
            # Reservation Unit is currently published, but is going to unpublish in the future.
            # It might be set to become published again in the future, but after it first unpublishes.
            models.When(
                (
                    # Unpublishes in the future.
                    models.Q(publish_ends_at__isnull=False)
                    & models.Q(publish_ends_at__gt=NowTT())
                    & (
                        # Was always published.
                        models.Q(publish_begins_at__isnull=True)
                        # Was published in the past.
                        | models.Q(publish_begins_at__lte=NowTT())
                        # Publishing begins again in the future, but after it first unpublishes.
                        | models.Q(publish_begins_at__gt=models.F("publish_ends_at"))
                    )
                ),
                then=models.Value(ReservationUnitPublishingState.SCHEDULED_HIDING.value),
            ),
            # Reservation Unit has not been published, but is going to be published,
            # and then unpublished in the future.
            models.When(
                (
                    # Publishes in the future.
                    models.Q(publish_begins_at__isnull=False)
                    & models.Q(publish_begins_at__gt=NowTT())
                    # Unpublishes in the future.
                    & models.Q(publish_ends_at__isnull=False)
                    & models.Q(publish_ends_at__gt=NowTT())
                    # Publishes before it unpublishes.
                    & models.Q(publish_begins_at__lt=models.F("publish_ends_at"))
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
                    models.Q(reservation_begins_at__isnull=False)
                    & models.Q(reservation_begins_at__gt=NowTT())
                    & (
                        # No previous reservation period.
                        models.Q(reservation_ends_at__isnull=True)
                        # Previous reservation period ended in the past.
                        | models.Q(reservation_ends_at__lte=NowTT())
                    )
                ),
                then=models.Value(ReservationUnitReservationState.SCHEDULED_RESERVATION.value),
            ),
            # Reservation Unit is currently not reservable, but will be in the future for a specific period.
            models.When(
                (
                    # Reservation period begins in the future.
                    models.Q(reservation_begins_at__isnull=False)
                    & models.Q(reservation_begins_at__gt=NowTT())
                    # Reservation period ends in the future
                    & models.Q(reservation_ends_at__isnull=False)
                    & models.Q(reservation_ends_at__gt=NowTT())
                    # Reservation period begins before it ends.
                    & models.Q(reservation_begins_at__lt=models.F("reservation_ends_at"))
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
                        models.Q(reservation_ends_at__isnull=False)
                        & models.Q(reservation_ends_at__lte=NowTT())
                        & (
                            # Reservation period was previously open.
                            models.Q(reservation_begins_at__isnull=True)
                            # Reservation period begun before it ended.
                            | (
                                models.Q(reservation_begins_at__isnull=False)
                                & models.Q(reservation_begins_at__lt=models.F("reservation_ends_at"))
                            )
                        )
                    )
                    | (
                        # Reservation period begins and ends at the exact same time.
                        models.Q(reservation_begins_at__isnull=False)
                        & models.Q(reservation_ends_at__isnull=False)
                        & models.Q(reservation_ends_at=models.F("reservation_begins_at"))
                    )
                ),
                then=models.Value(ReservationUnitReservationState.RESERVATION_CLOSED.value),
            ),
            # Reservation Unit is currently reservable, but will be closed in the future.
            # It might be set to become reservable again in the future, but after it first closes.
            models.When(
                (
                    # Reservation period ends in the future.
                    models.Q(reservation_ends_at__isnull=False)
                    & models.Q(reservation_ends_at__gt=NowTT())
                    & (
                        # Reservation period has never been closed.
                        models.Q(reservation_begins_at__isnull=True)
                        # Reservation period has begun in the past.
                        | models.Q(reservation_begins_at__lte=NowTT())
                        # Reservation period has begins again in the future, but after it first ends.
                        | models.Q(reservation_begins_at__gt=models.F("reservation_ends_at"))
                    )
                ),
                then=models.Value(ReservationUnitReservationState.SCHEDULED_CLOSING.value),
            ),
            # Otherwise, Reservation Unit is reservable
            default=models.Value(ReservationUnitReservationState.RESERVABLE.value),
            output_field=models.CharField(),
        )

        return case  # type: ignore[return-value]  # noqa: RET504

    @lookup_property(skip_codegen=True)
    def current_access_type() -> AccessType | None:
        """The access type that is currently active for the reservation unit."""
        from tilavarauspalvelu.models import ReservationUnitAccessType

        sq = Subquery(
            queryset=(
                ReservationUnitAccessType.objects.filter(reservation_unit=models.OuterRef("pk"))
                .active()
                .values("access_type")[:1]
            ),
            output_field=models.CharField(null=True),
        )
        return sq  # type: ignore[return-value]  # noqa: RET504

    @current_access_type.override
    def _(self) -> AccessType | None:
        return self.access_types.active().values_list("access_type", flat=True).first()


AuditLogger.register(
    ReservationUnit,
    # Exclude lookup properties, since they are calculated values.
    exclude_fields=[
        "_publishing_state",
        "_reservation_state",
        "_active_pricing_price",
        "_current_access_type",
    ],
)
