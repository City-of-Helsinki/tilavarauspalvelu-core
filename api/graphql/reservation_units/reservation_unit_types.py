import datetime
from typing import List, Optional

import graphene
from django.db.models import Q, QuerySet, Sum
from easy_thumbnails.files import get_thumbnailer
from graphene import ResolveInfo
from graphene_django import DjangoObjectType
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.duration_field import Duration
from api.graphql.merchants.merchant_types import PaymentMerchantType, PaymentProductType
from api.graphql.opening_hours.opening_hours_types import OpeningHoursMixin
from api.graphql.reservations.reservation_types import (
    ReservationMetadataSetType,
    ReservationType,
)
from api.graphql.resources.resource_types import ResourceType
from api.graphql.services.service_types import ServiceType
from api.graphql.spaces.space_types import LocationType, SpaceType
from api.graphql.terms_of_use.terms_of_use_types import TermsOfUseType
from api.graphql.translate_fields import get_all_translatable_fields
from api.graphql.units.unit_types import UnitType
from opening_hours.hauki_link_generator import generate_hauki_link
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
)
from permissions.api_permissions.graphene_permissions import (
    EquipmentCategoryPermission,
    EquipmentPermission,
    PurposePermission,
    QualifierPermission,
    ReservationUnitCancellationRulePermission,
    ReservationUnitHaukiUrlPermission,
    ReservationUnitPermission,
    ResourcePermission,
    ServicePermission,
    SpacePermission,
    UnitPermission,
)
from permissions.helpers import can_manage_units, can_modify_reservation_unit
from reservation_units.enums import ReservationUnitState
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
)
from reservation_units.models import ReservationUnitType as ReservationUnitTypeModel
from reservation_units.models import TaxPercentage
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import Reservation


def get_payment_type_codes() -> List[str]:
    return list(
        map(
            lambda payment_type: payment_type.code,
            ReservationUnitPaymentType.objects.all(),
        )
    )


class KeywordType(AuthNode, PrimaryKeyObjectType):
    class Meta:
        model = Keyword
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class TaxPercentageType(AuthNode, PrimaryKeyObjectType):
    class Meta:
        model = TaxPercentage
        fields = ["pk", "value"]
        filter_fields = ["value"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class KeywordGroupType(AuthNode, PrimaryKeyObjectType):

    keywords = graphene.List(KeywordType)

    class Meta:
        model = KeywordGroup
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_keywords(self, info):
        return self.keywords.all()


class KeywordCategoryType(AuthNode, PrimaryKeyObjectType):
    keyword_groups = graphene.List(KeywordGroupType)

    class Meta:
        model = KeywordCategory
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_keyword_groups(self, info):
        return self.keyword_groups.all()


class PurposeType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (PurposePermission,)

    image_url = graphene.String()
    small_url = graphene.String()

    class Meta:
        model = Purpose
        fields = ["pk", "image_url", "small_url", "rank"] + get_all_translatable_fields(
            model
        )
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_image_url(self, info):
        if not self.image:
            return None
        return info.context.build_absolute_uri(self.image.url)

    def resolve_small_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["purpose_image"].url
        return info.context.build_absolute_uri(url)


class QualifierType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (QualifierPermission,)

    class Meta:
        model = Qualifier
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ReservationUnitHaukiUrlType(AuthNode, DjangoObjectType):

    url = graphene.String()

    permission_classes = (ReservationUnitHaukiUrlPermission,)

    class Meta:
        model = ReservationUnit
        fields = ("url",)
        connection_class = TilavarausBaseConnection

    def resolve_url(self, info):
        if can_manage_units(info.context.user, self.unit):
            return generate_hauki_link(
                self.uuid,
                getattr(info.context.user, "email", ""),
                self.unit.tprek_department_id,
            )
        return None


class ReservationUnitImageType(PrimaryKeyObjectType):
    image_url = graphene.String()
    medium_url = graphene.String()
    small_url = graphene.String()
    large_url = graphene.String()

    class Meta:
        model = ReservationUnitImage
        fields = [
            "pk",
            "image_url",
            "large_url",
            "medium_url",
            "small_url",
            "image_type",
        ]
        connection_class = TilavarausBaseConnection

    def resolve_image_url(self, info):
        if not self.image:
            return None
        return info.context.build_absolute_uri(self.image.url)

    def resolve_large_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["large"].url

        return info.context.build_absolute_uri(url)

    def resolve_small_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["small"].url

        return info.context.build_absolute_uri(url)

    def resolve_medium_url(self, info):
        if not self.image:
            return None
        url = get_thumbnailer(self.image)["medium"].url

        return info.context.build_absolute_uri(url)


class ReservationUnitCancellationRuleType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (ReservationUnitCancellationRulePermission,)

    class Meta:
        model = ReservationUnitCancellationRule
        fields = [
            "pk",
            "can_be_cancelled_time_before",
            "needs_handling",
        ] + get_all_translatable_fields(model)
        filter_fields = ["name"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_can_be_cancelled_time_before(self, info: ResolveInfo):
        if not self.can_be_cancelled_time_before:
            return None
        return self.can_be_cancelled_time_before.total_seconds()


class ReservationUnitTypeType(PrimaryKeyObjectType):
    class Meta:
        model = ReservationUnitTypeModel
        fields = ["pk", "rank"] + get_all_translatable_fields(model)
        filter_fields = get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class EquipmentCategoryType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (EquipmentCategoryPermission,)

    class Meta:
        model = EquipmentCategory
        fields = ["pk"] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class EquipmentType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (EquipmentPermission,)
    category = graphene.Field(EquipmentCategoryType)

    class Meta:
        model = Equipment
        fields = ["pk"] + get_all_translatable_fields(model)

        filter_fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_category(self, info):
        return self.category


class ReservationUnitPaymentTypeType(AuthNode, PrimaryKeyObjectType):
    code = graphene.Field(
        graphene.String,
        description=(
            "Available values: "
            f"{', '.join(value for value in get_payment_type_codes())}"
        ),
    )

    class Meta:
        model = ReservationUnitPaymentType
        fields = ["code"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class ReservationUnitPricingType(AuthNode, PrimaryKeyObjectType):
    class Meta:
        model = ReservationUnitPricing
        fields = [
            "pk",
            "begins",
            "pricing_type",
            "price_unit",
            "lowest_price",
            "lowest_price_net",
            "highest_price",
            "highest_price_net",
            "tax_percentage",
            "status",
        ]


class ReservationUnitWithReservationsMixin:
    reservations = graphene.List(
        ReservationType,
        from_=graphene.Date(name="from"),
        to=graphene.Date(),
        state=graphene.List(graphene.String),
        include_with_same_components=graphene.Boolean(),
    )

    def resolve_reservations(
        self,
        info: ResolveInfo,
        from_: Optional[datetime.date] = None,
        to: Optional[datetime.date] = None,
        state: Optional[List[str]] = None,
        include_with_same_components: Optional[bool] = None,
    ) -> QuerySet:
        if include_with_same_components:
            reservations = Reservation.objects.with_same_components(self, from_, to)
        else:
            reservations = self.reservation_set.all()

            if from_ is not None:
                reservations = reservations.filter(begin__gte=from_)
            if to is not None:
                reservations = reservations.filter(end__lte=to)

        if state is not None:
            reservations = reservations.filter(state__in=state)

        return reservations


class ReservationUnitType(
    AuthNode, PrimaryKeyObjectType, ReservationUnitWithReservationsMixin
):
    spaces = graphene.List(SpaceType)
    resources = graphene.List(ResourceType)
    services = graphene.List(ServiceType)
    purposes = graphene.List(PurposeType)
    qualifiers = graphene.List(QualifierType)
    images = graphene.List(ReservationUnitImageType)
    location = graphene.Field(LocationType)
    reservation_unit_type = graphene.Field(ReservationUnitTypeType)
    equipment = graphene.List(EquipmentType)
    unit = graphene.Field(UnitType)
    max_persons = graphene.Int()
    surface_area = graphene.Decimal()
    max_reservation_duration = Duration()
    min_reservation_duration = Duration()
    keyword_groups = graphene.List(KeywordGroupType)
    application_rounds = graphene.List(
        "api.graphql.application_rounds.application_round_types.ApplicationRoundType",
        active=graphene.Boolean(),
    )
    cancellation_rule = graphene.Field(ReservationUnitCancellationRuleType)
    payment_terms = graphene.Field(TermsOfUseType)
    cancellation_terms = graphene.Field(TermsOfUseType)
    service_specific_terms = graphene.Field(TermsOfUseType)
    pricing_terms = graphene.Field(TermsOfUseType)
    tax_percentage = graphene.Field(TaxPercentageType)
    buffer_time_before = Duration()
    buffer_time_after = Duration()
    metadata_set = graphene.Field(ReservationMetadataSetType)
    state = graphene.Field(graphene.Enum.from_enum(ReservationUnitState))
    payment_types = graphene.List(ReservationUnitPaymentTypeType)
    payment_merchant = graphene.Field(PaymentMerchantType)
    payment_product = graphene.Field(PaymentProductType)

    permission_classes = (ReservationUnitPermission,)
    pricings = graphene.List(ReservationUnitPricingType)

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
            "tax_percentage",
            "lowest_price",
            "highest_price",
            "price_unit",
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
            "pricing_type",
            "payment_types",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "payment_merchant",
            "payment_product",
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
        connection_class = TilavarausBaseConnection

    def resolve_location(self, info):
        return self.get_location()

    def resolve_pricings(self, info):
        return self.pricings.all()

    @check_resolver_permission(SpacePermission)
    def resolve_spaces(self, info):
        return self.spaces.all()

    @check_resolver_permission(ServicePermission)
    def resolve_services(self, info):
        return self.services.all()

    @check_resolver_permission(PurposePermission)
    def resolve_purposes(self, info):
        return self.purposes.all()

    @check_resolver_permission(QualifierPermission)
    def resolve_qualifiers(self, info):
        return self.qualifiers.all()

    def resolve_images(self, info):
        return self.images.all()

    @check_resolver_permission(ResourcePermission)
    def resolve_resources(self, info):
        return self.resources.all()

    def resolve_reservation_unit_type(self, info):
        return self.reservation_unit_type

    @check_resolver_permission(EquipmentPermission)
    def resolve_equipment(self, info):
        if self.equipments is None:
            return []
        return self.equipments.all()

    @check_resolver_permission(UnitPermission)
    def resolve_unit(self, info):
        return self.unit

    def resolve_max_persons(self, info):
        return self.max_persons

    def resolve_surface_area(self, info):
        if self.surface_area is not None:
            return self.surface_area
        surface_area = self.spaces.aggregate(total_surface_area=Sum("surface_area"))
        return surface_area.get("total_surface_area")

    def resolve_keyword_groups(self, info):
        return KeywordGroup.objects.filter(reservation_units=self.id)

    def resolve_payment_types(self, info):
        return self.payment_types.all()

    def resolve_application_rounds(
        self, info: ResolveInfo, active: Optional[bool] = None
    ) -> QuerySet:
        application_rounds = self.application_rounds.all()
        if active is None:
            return application_rounds
        now = datetime.datetime.now().astimezone()
        active_filter = Q(
            application_period_begin__lte=now,
            application_period_end__gte=now,
        )
        return application_rounds.filter(active_filter if active else ~active_filter)

    @check_resolver_permission(ReservationUnitCancellationRulePermission)
    def resolve_cancellation_rule(self, info: ResolveInfo):
        return self.cancellation_rule

    def resolve_payment_merchant(self, info: ResolveInfo):
        if can_modify_reservation_unit(info.context.user, self):
            if self.payment_merchant is not None:
                return self.payment_merchant
            elif self.unit and self.unit.payment_merchant is not None:
                return self.unit.payment_merchant
        return None

    def resolve_payment_product(self, info: ResolveInfo):
        if can_modify_reservation_unit(info.context.user, self):
            return self.payment_product
        return None


class ReservationUnitByPkType(
    ReservationUnitType, OpeningHoursMixin, ReservationUnitWithReservationsMixin
):
    next_available_slot = graphene.DateTime()
    hauki_url = graphene.Field(ReservationUnitHaukiUrlType)

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
            "tax_percentage",
            "lowest_price",
            "highest_price",
            "price_unit",
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
            "pricing_type",
            "payment_types",
            "can_apply_free_of_charge",
            "reservations_max_days_before",
            "reservations_min_days_before",
            "allow_reservations_without_opening_hours",
            "is_archived",
            "state",
            "next_available_slot",
            "hauki_url",
            "opening_hours",
        ] + get_all_translatable_fields(model)

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_next_available_slot(self, info):
        scheduler = ReservationUnitReservationScheduler(self)
        start, end = scheduler.get_next_available_reservation_time()
        return start

    def resolve_hauki_url(self, info):
        return self
