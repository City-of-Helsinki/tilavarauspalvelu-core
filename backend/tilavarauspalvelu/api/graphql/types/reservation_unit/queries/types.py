import datetime
from typing import TypedDict

from django.db import models
from django.db.models import Sum
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError, GraphQLStatusError
from undine.optimizer import OptimizationData
from undine.relay import Node
from undine.utils.graphql.utils import get_arguments

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.integrations.opening_hours.hauki_link_generator import generate_hauki_link
from tilavarauspalvelu.models import PaymentMerchant, Reservation, ReservationUnit, User
from tilavarauspalvelu.models.reservable_time_span.queryset import ReservableTimeSpanQuerySet
from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.db import SubqueryCount

from .filtersets import ReservationUnitAllFilterSet, ReservationUnitFilterSet
from .orderset import ReservationUnitAllOrderSet, ReservationUnitOrderSet

__all__ = [
    "ReservationUnitAllNode",
    "ReservationUnitNode",
]


class GraphQLFRTCalculationMissingError(GraphQLStatusError):
    """Error raised when a value annotated after the first reservable time calculation is missing."""

    msg = "Field is only calculated in the top-level 'reservationUnits' field."
    code = error_codes.RESERVATION_UNIT_FIRST_RESERVABLE_DATETIME_NOT_CALCULATED


class ReservableTimeSpanType(TypedDict):
    start_datetime: datetime.datetime
    end_datetime: datetime.datetime


class ReservationUnitNode(
    QueryType[ReservationUnit],
    filterset=ReservationUnitFilterSet,
    orderset=ReservationUnitOrderSet,
    interfaces=[Node],
):
    # IDs
    pk = Field()
    ext_uuid = Field()
    rank = Field()

    # Strings
    name_fi = Field()
    name_sv = Field()
    name_en = Field()
    description_fi = Field()
    description_sv = Field()
    description_en = Field()
    notes_when_applying_fi = Field()
    notes_when_applying_sv = Field()
    notes_when_applying_en = Field()
    reservation_pending_instructions_fi = Field()
    reservation_pending_instructions_sv = Field()
    reservation_pending_instructions_en = Field()
    reservation_confirmed_instructions_fi = Field()
    reservation_confirmed_instructions_sv = Field()
    reservation_confirmed_instructions_en = Field()
    reservation_cancelled_instructions_fi = Field()
    reservation_cancelled_instructions_sv = Field()
    reservation_cancelled_instructions_en = Field()
    contact_information = Field()

    # Integers
    surface_area = Field()
    calculated_surface_area = Field(Sum("spaces__surface_area"))
    min_persons = Field()
    max_persons = Field()
    max_reservations_per_user = Field()
    reservations_min_days_before = Field()
    reservations_max_days_before = Field()

    # Datetime
    reservation_begins_at = Field()
    reservation_ends_at = Field()
    publish_begins_at = Field()
    publish_ends_at = Field()
    min_reservation_duration = Field()
    max_reservation_duration = Field()
    buffer_time_before = Field()
    buffer_time_after = Field()

    # Booleans
    is_draft = Field()
    is_archived = Field()
    require_adult_reservee = Field()
    require_reservation_handling = Field()
    reservation_block_whole_day = Field()
    can_apply_free_of_charge = Field()
    allow_reservations_without_opening_hours = Field()

    # Enums
    authentication = Field()
    reservation_start_interval = Field()
    reservation_kind = Field()
    reservation_form = Field()
    publishing_state = Field(L("publishing_state"))
    reservation_state = Field(L("reservation_state"))
    current_access_type = Field(L("current_access_type"))

    # List fields
    search_terms = Field()

    # Forward many-to-one related
    unit = Field()
    reservation_unit_type = Field()
    cancellation_rule = Field()
    metadata_set = Field()
    cancellation_terms = Field()
    service_specific_terms = Field()
    pricing_terms = Field()
    payment_terms = Field()

    payment_product = Field()

    @payment_product.permissions
    def payment_product_permissions(root: ReservationUnit, info: GQLInfo[User], value: PaymentMerchant) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_unit(root.unit):
            msg = "No permission to access payment product"
            raise GraphQLPermissionError(msg)

    @payment_product.optimize
    def payment_product_optimization(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        unit_data = data.add_select_related("unit")
        unit_data.add_prefetch_related("unit_groups")

    payment_merchant = Field(nullable=True)

    @payment_merchant.resolve
    def payment_merchant_resolver(root: ReservationUnit, info: GQLInfo[User]) -> PaymentMerchant | None:
        if root.payment_merchant is not None:
            return root.payment_merchant
        if root.unit is not None and root.unit.payment_merchant is not None:
            return root.unit.payment_merchant
        return None

    @payment_merchant.permissions
    def payment_merchant_permissions(root: ReservationUnit, info: GQLInfo[User], value: PaymentMerchant) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_unit(root.unit):
            msg = "No permission to access payment merchant"
            raise GraphQLPermissionError(msg)

    @payment_merchant.optimize
    def payment_merchant_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.add_select_related("payment_merchant")
        unit_data = data.add_select_related("unit")
        unit_data.add_select_related("payment_merchant")
        unit_data.add_prefetch_related("unit_groups")

    # Forward many-to-many related
    spaces = Field()
    resources = Field()
    purposes = Field()
    equipments = Field()

    # Reverse many-to-many related
    application_rounds = Field()
    reservations = Field()

    # Reverse one-to-many related
    images = Field()
    pricings = Field()
    access_types = Field()
    application_round_time_slots = Field()

    # "Special" fields
    @Field
    def hauki_url(root: ReservationUnit, info: GQLInfo[User]) -> str | None:
        if root.origin_hauki_resource is None:
            return None
        return generate_hauki_link(root.ext_uuid, info.context.user.email, root.unit.hauki_department_id)

    @hauki_url.permissions
    def hauki_url_permissions(root: ReservationUnit, info: GQLInfo[User], value: str) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_unit(root.unit):
            msg = "No permission to access field."
            raise GraphQLPermissionError(msg)

    @hauki_url.optimize
    def hauki_url_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("ext_uuid")

        data.add_select_related("origin_hauki_resource")

        unit_data = data.add_select_related("unit")
        unit_data.only_fields.add("tprek_department_id")

        unit_data.add_prefetch_related("unit_groups")

    @Field
    def reservable_time_spans(
        root: ReservationUnit,
        info: GQLInfo[User],
        # Used in optimizations
        start_date: datetime.date,  # noqa: ARG002
        end_date: datetime.date,  # noqa: ARG002
    ) -> list[ReservableTimeSpanType] | None:
        """
        Get all reservable time spans for this reservation unit's unit that fall within the given period.

        :param start_date: Start date of the period.
        :param end_date: End date of the period.
        """
        resource = root.origin_hauki_resource
        if resource is None:
            return None

        return [
            ReservableTimeSpanType(
                start_datetime=time_span.start_datetime.astimezone(DEFAULT_TIMEZONE),
                end_datetime=time_span.end_datetime.astimezone(DEFAULT_TIMEZONE),
            )
            for time_span in resource.reservable_time_spans.all()
        ]

    @reservable_time_spans.optimize
    def reservable_time_spans_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        ohr_data = data.add_select_related("origin_hauki_resource")
        ohr_data.only_fields.add("id")

        # Fetch to a separate attribute so that custom filtering is applied
        rts_data = ohr_data.add_prefetch_related("reservable_time_spans", to_attr="reservation_time_spans")
        rts_data.only_fields.add("id")
        rts_data.only_fields.add("start_datetime")
        rts_data.only_fields.add("end_datetime")

        args = get_arguments(info)
        start_date: datetime.date = args["start_date"]
        end_date: datetime.date = args["end_date"]

        def filter_rts(qs: ReservableTimeSpanQuerySet, info: GQLInfo[User]) -> ReservableTimeSpanQuerySet:
            return qs.overlapping_with_period(start=start_date, end=end_date)

        rts_data.pre_filter_callback = filter_rts  # type: ignore[assignment]

    @Field
    def num_active_user_reservations(self, info: GQLInfo[User]) -> int:
        """
        Number of active reservations made by the user to this ReservationUnit.
        This is used to determine if the user can make a new reservation based on the 'maxReservationsPerUser'.
        """
        return getattr(self, "num_active_user_reservations", 0)

    @num_active_user_reservations.optimize
    def optimize_num_active_user_reservations(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        if info.context.user.is_anonymous:
            data.annotations["num_active_user_reservations"] = models.Value(0)
            return

        qs = (
            Reservation.objects.all()
            .filter_for_user_num_active_reservations(
                reservation_unit=models.OuterRef("id"),
                user=info.context.user,
            )
            .values("id")
        )

        data.annotations["num_active_user_reservations"] = SubqueryCount(queryset=qs)

    @Field
    def is_closed(root: ReservationUnit, info: GQLInfo[User]) -> bool:
        if hasattr(root, "is_closed"):
            return root.is_closed
        raise GraphQLFRTCalculationMissingError

    @Field
    def first_reservable_datetime(root: ReservationUnit, info: GQLInfo[User]) -> datetime.datetime | None:
        if hasattr(root, "first_reservable_datetime"):
            return root.first_reservable_datetime
        raise GraphQLFRTCalculationMissingError

    @Field
    def effective_access_type(root: ReservationUnit, info: GQLInfo[User]) -> AccessType | None:
        if hasattr(root, "effective_access_type"):
            return root.effective_access_type
        raise GraphQLFRTCalculationMissingError

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationUnitQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        return queryset.filter(is_archived=False)


class ReservationUnitAllNode(
    QueryType[ReservationUnit],
    filterset=ReservationUnitAllFilterSet,
    orderset=ReservationUnitAllOrderSet,
    interfaces=[Node],
    register=False,
):
    """This Node should be kept to the bare minimum and never expose any relations to avoid performance issues."""

    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationUnitQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        return queryset.filter(is_archived=False)
