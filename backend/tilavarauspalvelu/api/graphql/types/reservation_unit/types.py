from __future__ import annotations

from typing import TYPE_CHECKING, NamedTuple

import graphene
from django.db import models
from django.db.models import Sum
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.errors import GQLCodeError
from lookup_property import L
from query_optimizer import AnnotatedField, DjangoListField, ManuallyOptimizedField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.api.graphql.types.reservation.types import ReservationNode
from tilavarauspalvelu.enums import AccessType, ReservationUnitPublishingState, ReservationUnitReservationState
from tilavarauspalvelu.integrations.opening_hours.hauki_link_generator import generate_hauki_link
from tilavarauspalvelu.models import OriginHaukiResource, PaymentMerchant, Reservation, ReservationUnit, Unit
from utils.date_utils import DEFAULT_TIMEZONE
from utils.db import SubqueryCount

from .filtersets import ReservationUnitAllFilterSet, ReservationUnitFilterSet
from .permissions import ReservationUnitAllPermission, ReservationUnitPermission

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ReservationUnitAllNode",
    "ReservationUnitNode",
]


class ReservableTimeSpanItem(NamedTuple):
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime


class ReservableTimeSpanType(graphene.ObjectType):
    start_datetime = graphene.DateTime()
    end_datetime = graphene.DateTime()


class ReservationUnitNode(DjangoNode):
    publishing_state = AnnotatedField(
        graphene.Enum.from_enum(ReservationUnitPublishingState),
        expression=L("publishing_state"),
        required=True,
    )
    reservation_state = AnnotatedField(
        graphene.Enum.from_enum(ReservationUnitReservationState),
        expression=L("reservation_state"),
        required=True,
    )

    is_closed = graphene.Boolean(required=True)
    first_reservable_datetime = graphene.DateTime()
    effective_access_type = graphene.Field(graphene.Enum.from_enum(AccessType))

    hauki_url = ManuallyOptimizedField(graphene.String)

    reservable_time_spans = graphene.List(
        graphene.NonNull(ReservableTimeSpanType),
        start_date=graphene.Date(required=True),
        end_date=graphene.Date(required=True),
    )

    reservations = DjangoListField(ReservationNode)

    num_active_user_reservations = ManuallyOptimizedField(graphene.Int, required=True)

    calculated_surface_area = AnnotatedField(graphene.Int, expression=Sum("surface_area"), required=True)

    current_access_type = AnnotatedField(graphene.Enum.from_enum(AccessType), expression=L("current_access_type"))

    class Meta:
        model = ReservationUnit
        fields = [
            #
            # IDs
            "pk",
            "ext_uuid",
            "rank",
            #
            # Strings
            "name",
            "description",
            "notes_when_applying",
            "contact_information",
            "reservation_pending_instructions",
            "reservation_confirmed_instructions",
            "reservation_cancelled_instructions",
            #
            # Integers
            "surface_area",
            "calculated_surface_area",
            "min_persons",
            "max_persons",
            "max_reservations_per_user",
            "reservations_min_days_before",
            "reservations_max_days_before",
            #
            # Datetime
            "reservation_begins_at",
            "reservation_ends_at",
            "publish_begins_at",
            "publish_ends_at",
            "min_reservation_duration",
            "max_reservation_duration",
            "buffer_time_before",
            "buffer_time_after",
            #
            # Booleans
            "is_draft",
            "is_archived",
            "require_adult_reservee",
            "require_reservation_handling",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            #
            # Enums
            "authentication",
            "reservation_start_interval",
            "reservation_kind",
            "reservation_form",
            "publishing_state",
            "reservation_state",
            "current_access_type",
            #
            # List fields
            "search_terms",
            #
            # Forward many-to-one related
            "unit",
            "reservation_unit_type",
            "cancellation_rule",
            "metadata_set",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "payment_terms",
            "payment_product",
            "payment_merchant",
            #
            # Forward many-to-many related
            "spaces",
            "resources",
            "purposes",
            "equipments",
            #
            # Reverse many-to-many related
            "application_rounds",
            "reservations",
            #
            # Reverse one-to-many related
            "images",
            "pricings",
            "access_types",
            "application_round_time_slots",
            #
            # "Special" fields
            "hauki_url",
            "reservable_time_spans",
            "is_closed",
            "first_reservable_datetime",
            "effective_access_type",
            "num_active_user_reservations",
        ]
        restricted_fields = {
            "cancellation_rule": lambda user: user.is_authenticated,
            "payment_merchant": lambda user, ru: user.permissions.can_manage_unit(ru.unit),
            "payment_product": lambda user, ru: user.permissions.can_manage_unit(ru.unit),
            "hauki_url": lambda user, ru: user.permissions.can_manage_unit(ru.unit),
        }
        max_complexity = 24
        filterset_class = ReservationUnitFilterSet
        permission_classes = [ReservationUnitPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        # Allow fetching data for archived reservation units, through relations from ReservationNode
        if getattr(info.return_type, "name", None) in {"ReservationNode", "ReservationNodeConnection"}:
            return queryset
        # Archived reservation units should not be directly visible in the API
        return queryset.filter(is_archived=False)

    def resolve_is_closed(root: ReservationUnit, info: GQLInfo) -> bool:
        # 'is_closed' is annotated by ReservationUnitFilterSet
        if hasattr(root, "is_closed"):
            return root.is_closed

        msg = (
            "Unexpected error: 'isClosed' should have been calculated but wasn't. "
            "Did you forget to set `calculateFirstReservableTime:true`?"
        )
        raise GQLCodeError(msg, code=error_codes.RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED)

    def resolve_first_reservable_datetime(root: ReservationUnit, info: GQLInfo) -> datetime.datetime | None:
        # 'first_reservable_datetime' is annotated by ReservationUnitFilterSet
        if hasattr(root, "first_reservable_datetime"):
            return root.first_reservable_datetime

        msg = (
            "Unexpected error: 'firstReservableDatetime' should have been calculated but wasn't. "
            "Did you forget to set `calculateFirstReservableTime:true`?"
        )
        raise GQLCodeError(msg, code=error_codes.RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED)

    def resolve_effective_access_type(root: ReservationUnit, info: GQLInfo) -> datetime.datetime | None:
        # 'effective_access_type' is annotated by ReservationUnitFilterSet
        if hasattr(root, "effective_access_type"):
            return root.effective_access_type

        msg = (
            "Unexpected error: 'effectiveAccessType' should have been calculated but wasn't. "
            "Did you forget to set `calculateFirstReservableTime:true`?"
        )
        raise GQLCodeError(msg, code=error_codes.RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED)

    @staticmethod
    def optimize_payment_merchant(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        # Fetch `payment_merchant` if not fetched yet.
        optimizer.get_or_set_child_optimizer(
            name="payment_merchant",
            optimizer=QueryOptimizer(
                PaymentMerchant,
                optimizer.info,
                name="payment_merchant",
                parent=optimizer,
            ),
        )

        # Fetch `unit` and unit's `payment_merchant` if not fetched yet.
        unit_optimizer = optimizer.get_or_set_child_optimizer(
            name="unit",
            optimizer=QueryOptimizer(
                Unit,
                optimizer.info,
                name="unit",
                parent=optimizer,
            ),
        )
        unit_optimizer.get_or_set_child_optimizer(
            name="payment_merchant",
            optimizer=QueryOptimizer(
                PaymentMerchant,
                optimizer.info,
                name="payment_merchant",
                parent=unit_optimizer,
            ),
        )

        return queryset

    def resolve_payment_merchant(root: ReservationUnit, info: GQLInfo) -> PaymentMerchant | None:
        if root.payment_merchant is not None:
            return root.payment_merchant
        if root.unit is not None and root.unit.payment_merchant is not None:
            return root.unit.payment_merchant
        return None

    @staticmethod
    def optimize_hauki_url(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        # Fetch `uuid` if not fetched yet.
        optimizer.only_fields.append("ext_uuid")

        # Fetch `origin_hauki_resource` if not fetched yet.
        optimizer.get_or_set_child_optimizer(
            name="origin_hauki_resource",
            optimizer=QueryOptimizer(
                OriginHaukiResource,
                optimizer.info,
                name="origin_hauki_resource",
                parent=optimizer,
            ),
        )
        optimizer.related_fields.append("origin_hauki_resource_id")

        # Fetch `unit` and `tprek_department_id` if not fetched yet.
        unit_optimizer = optimizer.get_or_set_child_optimizer(
            name="unit",
            optimizer=QueryOptimizer(
                Unit,
                optimizer.info,
                name="unit",
                parent=optimizer,
            ),
        )
        optimizer.related_fields.append("unit_id")
        unit_optimizer.only_fields.append("tprek_department_id")

        return queryset

    def resolve_hauki_url(root: ReservationUnit, info: GQLInfo) -> str | None:
        if root.origin_hauki_resource is None:
            return None

        return generate_hauki_link(root.ext_uuid, info.context.user.email, root.unit.hauki_department_id)

    def resolve_reservable_time_spans(
        root: ReservationUnit,
        info: GQLInfo,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> list[ReservableTimeSpanItem] | None:
        if root.origin_hauki_resource is None:
            return None

        return [
            ReservableTimeSpanItem(
                start_datetime=time_span.start_datetime.astimezone(DEFAULT_TIMEZONE),
                end_datetime=time_span.end_datetime.astimezone(DEFAULT_TIMEZONE),
            )
            for time_span in root.origin_hauki_resource.reservable_time_spans.all().overlapping_with_period(
                start_date, end_date
            )
        ]

    @staticmethod
    def optimize_num_active_user_reservations(queryset: models.QuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        if optimizer.info.context.user.is_anonymous:
            return queryset.annotate(num_active_user_reservations=models.Value(0))

        return queryset.annotate(
            num_active_user_reservations=SubqueryCount(
                Reservation.objects.filter_for_user_num_active_reservations(
                    reservation_unit=models.OuterRef("id"),
                    user=optimizer.info.context.user,
                ).values("id")
            ),
        )

    def resolve_num_active_user_reservations(root: ReservationUnit, info: GQLInfo) -> int:
        """
        Number of active reservations made by the user to this ReservationUnit.
        This is used to determine if the user can make a new reservation based on the max_reservations_per_user.
        """
        return getattr(root, "num_active_user_reservations", 0)


class ReservationUnitAllNode(DjangoNode):
    """This Node should be kept to the bare minimum and never expose any relations to avoid performance issues."""

    class Meta:
        model = ReservationUnit
        fields = [
            "pk",
            "name",
        ]
        filterset_class = ReservationUnitAllFilterSet
        permission_classes = [ReservationUnitAllPermission]
        skip_registry = True

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        # Always hide archived reservation units
        return queryset.filter(is_archived=False)
