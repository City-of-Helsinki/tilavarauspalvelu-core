import datetime
from typing import NamedTuple

import graphene
from django.db import models
from django.db.models import Sum
from django.utils.timezone import get_default_timezone
from graphene_django_extensions import DjangoNode
from graphql import GraphQLError
from query_optimizer import AnnotatedField, DjangoListField

from api.graphql.types.location.types import LocationNode
from api.graphql.types.reservation.types import ReservationNode
from api.graphql.types.reservation_unit.filtersets import ReservationUnitFilterSet
from api.graphql.types.reservation_unit.permissions import ReservationUnitPermission
from common.typing import GQLInfo
from merchants.models import PaymentMerchant
from opening_hours.utils.hauki_link_generator import generate_hauki_link
from permissions.helpers import can_manage_units, can_modify_reservation_unit
from reservation_units.enums import ReservationState, ReservationUnitState
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationTypeChoice
from spaces.models import Location

__all__ = [
    "ReservationUnitNode",
]


class ReservableTimeSpanItem(NamedTuple):
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime


class ReservableTimeSpanType(graphene.ObjectType):
    start_datetime = graphene.DateTime()
    end_datetime = graphene.DateTime()


class ReservationUnitNode(DjangoNode):
    state = graphene.Field(graphene.Enum.from_enum(ReservationUnitState))
    reservation_state = graphene.Field(graphene.Enum.from_enum(ReservationState))

    location = graphene.Field(LocationNode)

    is_closed = graphene.Boolean()
    first_reservable_datetime = graphene.DateTime()

    hauki_url = graphene.String()

    reservable_time_spans = graphene.List(
        ReservableTimeSpanType,
        start_date=graphene.Date(required=True),
        end_date=graphene.Date(required=True),
    )

    reservation_set = DjangoListField(ReservationNode)

    num_active_user_reservations = graphene.Int()

    calculated_surface_area = AnnotatedField(graphene.Int, expression=Sum("surface_area"))

    class Meta:
        model = ReservationUnit
        fields = [
            #
            # IDs
            "pk",
            "uuid",
            "rank",
            #
            # Strings
            "name",
            "description",
            "terms_of_use",
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
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "min_reservation_duration",
            "max_reservation_duration",
            "buffer_time_before",
            "buffer_time_after",
            #
            # Booleans
            "is_draft",
            "is_archived",
            "require_introduction",
            "require_reservation_handling",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "allow_reservations_without_opening_hours",
            #
            # Enums
            "authentication",
            "reservation_start_interval",
            "reservation_kind",
            "state",
            "reservation_state",
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
            "location",
            #
            # Forward many-to-many related
            "spaces",
            "resources",
            "purposes",
            "equipments",
            "services",
            "payment_types",
            "qualifiers",
            #
            # Reverse many-to-many related
            "application_rounds",
            "reservation_set",
            #
            # Reverse one-to-many related
            "images",
            "pricings",
            "application_round_time_slots",
            #
            # "Special" fields
            "hauki_url",
            "reservable_time_spans",
            "is_closed",
            "first_reservable_datetime",
            "num_active_user_reservations",
        ]
        restricted_fields = {
            "cancellation_rule": lambda user: user.is_authenticated,
            "payment_merchant": lambda user, reservation_unit: can_modify_reservation_unit(user, reservation_unit),
            "payment_product": lambda user, reservation_unit: can_modify_reservation_unit(user, reservation_unit),
            "hauki_url": lambda user, reservation_unit: can_manage_units(user, reservation_unit.unit),
        }
        max_complexity = 20
        filterset_class = ReservationUnitFilterSet
        permission_classes = [ReservationUnitPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        # Always hide archived reservation units
        return queryset.filter(is_archived=False)

    def resolve_is_closed(root: ReservationUnit, info: GQLInfo) -> bool:
        # 'is_closed' is annotated by ReservationUnitFilterSet
        if hasattr(root, "is_closed"):
            return root.is_closed

        raise GraphQLError("Unexpected error: 'is_closed' should have been calculated but wasn't.")

    def resolve_first_reservable_datetime(root: ReservationUnit, info: GQLInfo) -> datetime.datetime | None:
        # 'first_reservable_datetime' is annotated by ReservationUnitFilterSet
        if hasattr(root, "first_reservable_datetime"):
            return root.first_reservable_datetime

        raise GraphQLError("Unexpected error: 'first_reservable_datetime' should have been calculated but wasn't.")

    def resolve_location(root: ReservationUnit, info: GQLInfo) -> Location:
        return root.actions.get_location()

    def resolve_payment_merchant(root: ReservationUnit, info: GQLInfo) -> PaymentMerchant | None:
        if root.payment_merchant is not None:
            return root.payment_merchant
        if root.unit is not None and root.unit.payment_merchant is not None:
            return root.unit.payment_merchant
        return None

    def resolve_hauki_url(root: ReservationUnit, info: GQLInfo) -> str | None:
        return generate_hauki_link(root.uuid, info.context.user.email, root.unit.hauki_department_id)

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
                start_datetime=time_span.start_datetime.astimezone(get_default_timezone()),
                end_datetime=time_span.end_datetime.astimezone(get_default_timezone()),
            )
            for time_span in root.origin_hauki_resource.reservable_time_spans.all().overlapping_with_period(
                start_date, end_date
            )
        ]

    def resolve_num_active_user_reservations(root: ReservationUnit, info: GQLInfo) -> int:
        """
        Number of active reservations made by the user to this ReservationUnit.
        This is used to determine if the user can make a new reservation based on the max_reservations_per_user.
        """
        if not info.context.user.is_authenticated:
            return 0
        return (
            root.reservation_set.filter(user=info.context.user)
            .exclude(type=ReservationTypeChoice.SEASONAL)
            .active()
            .count()
        )
