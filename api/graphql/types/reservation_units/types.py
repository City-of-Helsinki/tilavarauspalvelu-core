import datetime

import graphene
from django.db.models import Q, QuerySet, Sum
from django.utils.timezone import get_default_timezone
from graphene_django import DjangoListField, DjangoObjectType
from graphene_permissions.mixins import AuthNode
from graphql import GraphQLError

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.duration_field import Duration
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.extensions.permission_helpers import check_resolver_permission
from api.graphql.types.application_round_time_slot.types import ApplicationRoundTimeSlotNode
from api.graphql.types.equipment.permissions import EquipmentPermission
from api.graphql.types.equipment.types import EquipmentType
from api.graphql.types.keyword.types import KeywordGroupType
from api.graphql.types.merchants.types import PaymentMerchantType, PaymentProductType
from api.graphql.types.purpose.permissions import PurposePermission
from api.graphql.types.purpose.types import PurposeType
from api.graphql.types.qualifier.permissions import QualifierPermission
from api.graphql.types.qualifier.types import QualifierType
from api.graphql.types.reservation_unit_cancellation_rule.permissions import ReservationUnitCancellationRulePermission
from api.graphql.types.reservation_unit_cancellation_rule.types import ReservationUnitCancellationRuleType
from api.graphql.types.reservation_unit_payment_type.types import ReservationUnitPaymentTypeType
from api.graphql.types.reservation_unit_pricing.types import ReservationUnitPricingType
from api.graphql.types.reservation_unit_type.types import ReservationUnitTypeType
from api.graphql.types.reservation_units.permissions import ReservationUnitHaukiUrlPermission, ReservationUnitPermission
from api.graphql.types.reservations.types import ReservationMetadataSetType, ReservationType
from api.graphql.types.resources.permissions import ResourcePermission
from api.graphql.types.resources.types import ResourceType
from api.graphql.types.services.permissions import ServicePermission
from api.graphql.types.services.types import ServiceType
from api.graphql.types.spaces.permissions import SpacePermission
from api.graphql.types.spaces.types import LocationType, SpaceType
from api.graphql.types.terms_of_use.types import TermsOfUseType
from api.graphql.types.units.permissions import UnitPermission
from api.graphql.types.units.types import UnitType
from applications.models import ApplicationRound
from common.typing import GQLInfo
from opening_hours.utils.hauki_link_generator import generate_hauki_link
from permissions.helpers import can_manage_units, can_modify_reservation_unit
from reservation_units.enums import ReservationState, ReservationUnitState
from reservation_units.models import KeywordGroup, ReservationUnit, ReservationUnitPricing
from reservations.models import Reservation
from spaces.models import Space
from tilavarauspalvelu.utils.date_util import end_of_day, start_of_day
from utils.query_performance import QueryPerformanceOptimizerMixin

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUnitHaukiUrlType(AuthNode, DjangoObjectType):
    url = graphene.String()

    permission_classes = (ReservationUnitHaukiUrlPermission,)

    class Meta:
        model = ReservationUnit
        fields = ("url",)
        connection_class = TVPBaseConnection

    def __init__(
        self,
        *args,
        instance: ReservationUnit = None,
        include_reservation_units: list[int] | None = None,
        **kwargs,
    ):
        super().__init__(*args, **kwargs)

        if instance:
            self.instance = instance
            self.uuid = instance.uuid
            self.unit = instance.unit
            self.include_reservation_units = include_reservation_units

    def resolve_url(root: ReservationUnit, info, **kwargs):
        if can_manage_units(info.context.user, root.unit):
            target_uuids = []
            include_reservation_units = getattr(root, "include_reservation_units", None)

            if include_reservation_units:
                res_units_in_db = ReservationUnit.objects.filter(id__in=include_reservation_units)

                difference = set(include_reservation_units).difference({res_unit.id for res_unit in res_units_in_db})

                if difference:
                    raise GraphQLError("Wrong identifier for reservation unit in url generation.")
                target_uuids = res_units_in_db.filter(unit=root.unit).values_list("uuid", flat=True)

            return generate_hauki_link(
                root.uuid,
                getattr(info.context.user, "email", ""),
                root.unit.hauki_department_id,
                target_resources=target_uuids,
            )
        return None


class ReservationUnitWithReservationsMixin:
    reservations = graphene.List(
        ReservationType,
        from_=graphene.Date(name="from"),
        to=graphene.Date(),
        state=graphene.List(graphene.String),
        include_with_same_components=graphene.Boolean(),
    )

    def resolve_reservations(
        self: ReservationUnit,
        info: GQLInfo,
        from_: datetime.date | None = None,
        to: datetime.date | None = None,
        state: list[str] | None = None,
        include_with_same_components: bool | None = None,
    ) -> QuerySet:
        from_ = start_of_day(from_)
        to = end_of_day(to)

        if include_with_same_components:
            reservations = Reservation.objects.with_same_components(self, from_, to)
        else:
            reservations = self.reservation_set.all()

            if from_ is not None:
                reservations = reservations.filter(begin__gte=from_)
            if to is not None:
                reservations = reservations.filter(end__lte=to)

        if state is not None:
            states = [s.lower() for s in state]
            reservations = reservations.filter(state__in=states)

        return reservations.order_by("begin")


class ReservationUnitType(
    QueryPerformanceOptimizerMixin,
    AuthNode,
    OldPrimaryKeyObjectType,
    ReservationUnitWithReservationsMixin,
):
    spaces = graphene.List(SpaceType)
    resources = graphene.List(ResourceType)
    services = graphene.List(ServiceType)
    purposes = graphene.List(PurposeType)
    qualifiers = graphene.List(QualifierType)
    location = graphene.Field(LocationType)
    reservation_unit_type = graphene.Field(ReservationUnitTypeType)
    equipment = graphene.List(EquipmentType)
    unit = graphene.Field(UnitType)
    max_persons = graphene.Int()
    surface_area = graphene.Int()
    max_reservation_duration = Duration()
    min_reservation_duration = Duration()
    keyword_groups = graphene.List(KeywordGroupType)
    application_rounds = graphene.List(
        "api.graphql.types.application_round.types.ApplicationRoundNode",
        active=graphene.Boolean(),
    )
    cancellation_rule = graphene.Field(ReservationUnitCancellationRuleType)
    payment_terms = graphene.Field(TermsOfUseType)
    cancellation_terms = graphene.Field(TermsOfUseType)
    service_specific_terms = graphene.Field(TermsOfUseType)
    pricing_terms = graphene.Field(TermsOfUseType)
    buffer_time_before = Duration()
    buffer_time_after = Duration()
    metadata_set = graphene.Field(ReservationMetadataSetType)
    state = graphene.Field(graphene.Enum.from_enum(ReservationUnitState))
    reservation_state = graphene.Field(graphene.Enum.from_enum(ReservationState))
    payment_types = graphene.List(ReservationUnitPaymentTypeType)
    payment_merchant = graphene.Field(PaymentMerchantType)
    payment_product = graphene.Field(PaymentProductType)

    permission_classes = (ReservationUnitPermission,)
    pricings = graphene.List(ReservationUnitPricingType)

    application_round_time_slots = DjangoListField(ApplicationRoundTimeSlotNode)

    is_closed = graphene.Boolean()
    first_reservable_datetime = graphene.DateTime()

    class Meta:
        model = ReservationUnit
        fields = [
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "qualifiers",
            "images",
            "location",
            "max_persons",
            "min_persons",
            "reservation_unit_type",
            "equipment",
            "uuid",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "reservations",
            "application_rounds",
            "cancellation_rule",
            "payment_terms",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "pricings",
            "reservation_start_interval",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "rank",
            "reservation_kind",
            "payment_types",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "reservation_state",
            "payment_merchant",
            "payment_product",
            "application_round_time_slots",
            "is_closed",
            "first_reservable_datetime",
        ] + get_all_translatable_fields(model)
        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
            "description_fi": ["exact", "icontains"],
            "description_sv": ["exact", "icontains"],
            "description_en": ["exact", "icontains"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    class QueryOptimization:
        field_name = "reservationUnits"
        query_optimization = {
            "spaces": (
                "prefetch",
                {
                    "field_name": "spaces",
                    "base_queryset": Space.objects.all().select_related("location"),
                    "child_optimizations": {
                        "location": ("select", "location"),
                    },
                },
            ),
            "resources": ("prefetch", "resources"),
            "services": ("prefetch", "services"),
            "purposes": ("prefetch", "purposes"),
            "qualifiers": ("prefetch", "qualifiers"),
            "images": ("prefetch", "images"),
            "reservationUnitType": ("select", "reservation_unit_type"),
            "equipment": ("prefetch", "equipments"),
            "unit": ("select", "unit"),
            "keywordGroups": ("prefetch", "keyword_groups"),
            "applicationRounds": (
                "prefetch",
                {
                    "field_name": "application_rounds",
                    "base_queryset": ApplicationRound.objects.all(),
                    "child_optimizations": {
                        "purposes": ("prefetch", "purposes"),
                        "serviceSector": ("select", "service_sector"),
                        "applicationRoundBaskets": (
                            "prefetch",
                            "application_round_baskets",
                        ),
                    },
                },
            ),
            "metadataSet": ("select", "metadata_set"),
            "paymentTypes": ("prefetch", "payment_types"),
            "paymentMerchant": ("select", "payment_merchant"),
            "paymentProduct": ("select", "payment_product"),
            "pricings": (
                "prefetch",
                {
                    "field_name": "pricings",
                    "base_queryset": ReservationUnitPricing.objects.all().select_related("tax_percentage"),
                    "child_optimizations": {
                        "taxPercentage": ("select", "tax_percentage"),
                    },
                },
            ),
            "pricingTerms": ("select", "pricing_terms"),
            "cancellationTerms": ("select", "cancellation_terms"),
            "cancellationRule": ("select", "cancellation_rule"),
        }

    def resolve_location(root: ReservationUnit, info: GQLInfo):
        return root.actions.get_location()

    def resolve_pricings(root: ReservationUnit, info: GQLInfo):
        return root.pricings.all()

    @check_resolver_permission(SpacePermission)
    def resolve_spaces(root: ReservationUnit, info: GQLInfo):
        return root.spaces.all()

    @check_resolver_permission(ServicePermission)
    def resolve_services(root: ReservationUnit, info: GQLInfo):
        return root.services.all()

    @check_resolver_permission(PurposePermission)
    def resolve_purposes(root: ReservationUnit, info: GQLInfo):
        return root.purposes.all()

    @check_resolver_permission(QualifierPermission)
    def resolve_qualifiers(root: ReservationUnit, info: GQLInfo):
        return root.qualifiers.all()

    @check_resolver_permission(ResourcePermission)
    def resolve_resources(root: ReservationUnit, info: GQLInfo):
        return root.resources.all()

    def resolve_reservation_unit_type(root: ReservationUnit, info: GQLInfo):
        return root.reservation_unit_type

    @check_resolver_permission(EquipmentPermission)
    def resolve_equipment(root: ReservationUnit, info: GQLInfo):
        if root.equipments is None:
            return []
        return root.equipments.all()

    @check_resolver_permission(UnitPermission)
    def resolve_unit(root: ReservationUnit, info: GQLInfo):
        return root.unit

    def resolve_max_persons(root: ReservationUnit, info: GQLInfo):
        return root.max_persons

    def resolve_surface_area(root: ReservationUnit, info: GQLInfo):
        if root.surface_area is not None:
            return root.surface_area
        surface_area = root.spaces.aggregate(total_surface_area=Sum("surface_area"))
        return surface_area.get("total_surface_area")

    def resolve_keyword_groups(root: ReservationUnit, info: GQLInfo):
        return KeywordGroup.objects.filter(reservation_units=root.id)

    def resolve_payment_types(root: ReservationUnit, info: GQLInfo):
        return root.payment_types.all()

    def resolve_application_rounds(root: ReservationUnit, info: GQLInfo, active: bool | None = None) -> QuerySet:
        application_rounds = root.application_rounds.all()
        if active is None:
            return application_rounds
        now = datetime.datetime.now().astimezone()
        active_filter = Q(
            application_period_begin__lte=now,
            application_period_end__gte=now,
        )
        return application_rounds.filter(active_filter if active else ~active_filter)

    @check_resolver_permission(ReservationUnitCancellationRulePermission)
    def resolve_cancellation_rule(root: ReservationUnit, info: GQLInfo):
        return root.cancellation_rule

    def resolve_payment_merchant(root: ReservationUnit, info: GQLInfo):
        if can_modify_reservation_unit(info.context.user, root):
            if root.payment_merchant is not None:
                return root.payment_merchant
            elif root.unit and root.unit.payment_merchant is not None:
                return root.unit.payment_merchant
        return None

    def resolve_payment_product(root: ReservationUnit, info: GQLInfo):
        if can_modify_reservation_unit(info.context.user, root):
            return root.payment_product
        return None

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


class ReservableTimeSpanType(graphene.ObjectType):
    start_datetime = graphene.DateTime()
    end_datetime = graphene.DateTime()

    def resolve_start_datetime(self: "ReservableTimeSpanType", info: GQLInfo):
        return self.start_datetime

    def resolve_end_datetime(self: "ReservableTimeSpanType", info: GQLInfo):
        return self.end_datetime


class ReservationUnitByPkType(ReservationUnitType, ReservationUnitWithReservationsMixin):
    hauki_url = graphene.Field(ReservationUnitHaukiUrlType)
    reservable_time_spans = graphene.List(
        ReservableTimeSpanType,
        start_date=graphene.Date(required=True),
        end_date=graphene.Date(required=True),
    )

    class Meta:
        model = ReservationUnit
        fields = [
            "pk",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "images",
            "location",
            "max_persons",
            "min_persons",
            "reservation_unit_type",
            "equipment",
            "uuid",
            "contact_information",
            "max_reservation_duration",
            "min_reservation_duration",
            "is_draft",
            "surface_area",
            "buffer_time_before",
            "buffer_time_after",
            "reservations",
            "application_rounds",
            "cancellation_rule",
            "payment_terms",
            "cancellation_terms",
            "service_specific_terms",
            "pricing_terms",
            "reservation_start_interval",
            "reservation_begins",
            "reservation_ends",
            "publish_begins",
            "publish_ends",
            "metadata_set",
            "max_reservations_per_user",
            "require_reservation_handling",
            "authentication",
            "rank",
            "reservation_kind",
            "payment_types",
            "reservation_block_whole_day",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "hauki_url",
            "reservable_time_spans",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_hauki_url(root: ReservationUnit, info: GQLInfo):
        return root

    def resolve_reservable_time_spans(
        root: ReservationUnit,
        info: GQLInfo,
        start_date: datetime.date,
        end_date: datetime.date,
    ) -> list[ReservableTimeSpanType] | None:
        origin_hauki_resource = root.origin_hauki_resource

        if not origin_hauki_resource:
            return None

        time_span_qs = origin_hauki_resource.reservable_time_spans.overlapping_with_period(
            start=start_date, end=end_date
        )
        return [
            ReservableTimeSpanType(
                start_datetime=time_span.start_datetime.astimezone(DEFAULT_TIMEZONE),
                end_datetime=time_span.end_datetime.astimezone(DEFAULT_TIMEZONE),
            )
            for time_span in time_span_qs
        ]
