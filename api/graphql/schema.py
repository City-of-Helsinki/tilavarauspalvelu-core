from typing import Any

import graphene
from django.conf import settings
from graphene import Field, relay
from graphene_django.debug import DjangoDebug
from rest_framework.generics import get_object_or_404

from api.graphql.extensions.permission_helpers import check_resolver_permission
from api.graphql.types.application.mutations import (
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationDeclineMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
)
from api.graphql.types.application.types import ApplicationNode
from api.graphql.types.application_event.mutations import (
    ApplicationEventCreateMutation,
    ApplicationEventDeclineMutation,
    ApplicationEventDeleteMutation,
    ApplicationEventUpdateMutation,
)
from api.graphql.types.application_event.types import ApplicationEventNode
from api.graphql.types.application_event_schedule.mutations import (
    ApplicationEventScheduleApproveMutation,
    ApplicationEventScheduleDeclineMutation,
    ApplicationEventScheduleResetMutation,
)
from api.graphql.types.application_event_schedule.types import ApplicationEventScheduleNode
from api.graphql.types.application_round.types import ApplicationRoundNode
from api.graphql.types.banner_notification.mutations import (
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
)
from api.graphql.types.banner_notification.types import BannerNotificationNode
from api.graphql.types.city.types import CityNode
from api.graphql.types.merchants.mutations import RefreshOrderMutation
from api.graphql.types.merchants.permissions import PaymentOrderPermission
from api.graphql.types.merchants.types import PaymentOrderType
from api.graphql.types.recurring_reservation.fields import RecurringReservationsFilter
from api.graphql.types.recurring_reservation.filtersets import RecurringReservationFilterSet
from api.graphql.types.recurring_reservation.mutations import (
    RecurringReservationCreateMutation,
    RecurringReservationUpdateMutation,
)
from api.graphql.types.reservation_units.fields import (
    EquipmentCategoryFilter,
    EquipmentFilter,
    KeywordFilter,
    PurposeFilter,
    QualifierFilter,
    ReservationUnitCancellationRulesFilter,
    ReservationUnitsFilter,
    ReservationUnitTypesFilter,
    TaxPercentageFilter,
)
from api.graphql.types.reservation_units.filtersets import (
    EquipmentFilterSet,
    PurposeFilterSet,
    ReservationUnitsFilterSet,
    ReservationUnitTypeFilterSet,
)
from api.graphql.types.reservation_units.mutations import (
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
    PurposeCreateMutation,
    PurposeUpdateMutation,
    ReservationUnitCreateMutation,
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
    ReservationUnitUpdateMutation,
)
from api.graphql.types.reservation_units.permissions import (
    EquipmentCategoryPermission,
    EquipmentPermission,
    ReservationUnitPermission,
)
from api.graphql.types.reservation_units.types import (
    EquipmentCategoryType,
    EquipmentType,
    KeywordCategoryType,
    KeywordGroupType,
    KeywordType,
    PurposeType,
    QualifierType,
    ReservationUnitByPkType,
    ReservationUnitCancellationRuleType,
    ReservationUnitHaukiUrlType,
    ReservationUnitType,
    ReservationUnitTypeType,
    TaxPercentageType,
)
from api.graphql.types.reservations.fields import (
    AgeGroupFilter,
    ReservationCancelReasonFilter,
    ReservationDenyReasonFilter,
    ReservationMetadataSetFilter,
    ReservationPurposeFilter,
    ReservationsFilter,
)
from api.graphql.types.reservations.filtersets import ReservationFilterSet
from api.graphql.types.reservations.mutations import (
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteMutation,
    ReservationDenyMutation,
    ReservationRefundMutation,
    ReservationRequiresHandlingMutation,
    ReservationStaffAdjustTimeMutation,
    ReservationStaffCreateMutation,
    ReservationStaffModifyMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
)
from api.graphql.types.reservations.permissions import ReservationPermission
from api.graphql.types.reservations.types import (
    AgeGroupType,
    RecurringReservationType,
    ReservationCancelReasonType,
    ReservationDenyReasonType,
    ReservationMetadataSetType,
    ReservationPurposeType,
    ReservationType,
)
from api.graphql.types.resources.fields import ResourcesFilter
from api.graphql.types.resources.filtersets import ResourceFilterSet
from api.graphql.types.resources.mutations import ResourceCreateMutation, ResourceDeleteMutation, ResourceUpdateMutation
from api.graphql.types.resources.permissions import ResourcePermission
from api.graphql.types.resources.types import ResourceType
from api.graphql.types.spaces.fields import ServiceSectorFilter, SpacesFilter
from api.graphql.types.spaces.filtersets import SpaceFilterSet
from api.graphql.types.spaces.mutations import SpaceCreateMutation, SpaceDeleteMutation, SpaceUpdateMutation
from api.graphql.types.spaces.permissions import SpacePermission
from api.graphql.types.spaces.types import ServiceSectorType, SpaceType
from api.graphql.types.terms_of_use.fields import TermsOfUseFilter
from api.graphql.types.terms_of_use.types import TermsOfUseType
from api.graphql.types.units.fields import UnitsFilter
from api.graphql.types.units.filtersets import UnitsFilterSet
from api.graphql.types.units.mutations import UnitUpdateMutation
from api.graphql.types.units.permissions import UnitPermission
from api.graphql.types.units.types import UnitByPkType, UnitType
from api.graphql.types.users.mutations import UserUpdateMutation
from api.graphql.types.users.permissions import UserPermission
from api.graphql.types.users.types import UserType
from common.models import BannerNotification
from common.typing import GQLInfo
from merchants.models import PaymentOrder
from permissions.helpers import can_handle_reservation, can_manage_banner_notifications
from reservation_units.models import Equipment, EquipmentCategory, ReservationUnit
from reservations.models import Reservation
from resources.models import Resource
from spaces.models import Space, Unit
from users.models import User


class Query(graphene.ObjectType):
    application_rounds = ApplicationRoundNode.Connection()
    applications = ApplicationNode.Connection()
    application_events = ApplicationEventNode.Connection()
    application_event_schedules = ApplicationEventScheduleNode.Connection()

    reservations = ReservationsFilter(ReservationType, filterset_class=ReservationFilterSet)
    reservation_by_pk = Field(ReservationType, pk=graphene.Int())

    recurring_reservations = RecurringReservationsFilter(
        RecurringReservationType, filterset_class=RecurringReservationFilterSet
    )

    reservation_cancel_reasons = ReservationCancelReasonFilter(ReservationCancelReasonType)

    reservation_deny_reasons = ReservationDenyReasonFilter(ReservationDenyReasonType)

    reservation_units = ReservationUnitsFilter(ReservationUnitType, filterset_class=ReservationUnitsFilterSet)
    reservation_unit = relay.Node.Field(ReservationUnitType)
    reservation_unit_by_pk = Field(ReservationUnitByPkType, pk=graphene.Int())
    reservation_unit_cancellation_rules = ReservationUnitCancellationRulesFilter(ReservationUnitCancellationRuleType)
    reservation_unit_hauki_url = Field(
        ReservationUnitHaukiUrlType,
        pk=graphene.Int(),
        reservation_units=graphene.List(graphene.Int),
    )

    reservation_unit_types = ReservationUnitTypesFilter(
        ReservationUnitTypeType, filterset_class=ReservationUnitTypeFilterSet
    )

    resources = ResourcesFilter(ResourceType, filterset_class=ResourceFilterSet)
    resource = relay.Node.Field(ResourceType)
    resource_by_pk = Field(ResourceType, pk=graphene.Int())

    equipments = EquipmentFilter(EquipmentType, filterset_class=EquipmentFilterSet)
    equipment = relay.Node.Field(EquipmentType)
    equipment_by_pk = Field(EquipmentType, pk=graphene.Int())

    equipment_categories = EquipmentCategoryFilter(EquipmentCategoryType)
    equipment_category = relay.Node.Field(EquipmentCategoryType)
    equipment_category_by_pk = Field(EquipmentCategoryType, pk=graphene.Int())

    spaces = SpacesFilter(SpaceType, filterset_class=SpaceFilterSet)
    space = relay.Node.Field(SpaceType)
    space_by_pk = Field(SpaceType, pk=graphene.Int())
    service_sectors = ServiceSectorFilter(ServiceSectorType)

    units = UnitsFilter(UnitType, filterset_class=UnitsFilterSet)
    unit = relay.Node.Field(UnitType)
    unit_by_pk = Field(UnitByPkType, pk=graphene.Int())

    current_user = Field(UserType)
    user = Field(UserType, pk=graphene.Int())

    keyword_categories = KeywordFilter(KeywordCategoryType)
    keyword_groups = KeywordFilter(KeywordGroupType)
    keywords = KeywordFilter(KeywordType)

    purposes = PurposeFilter(PurposeType, filterset_class=PurposeFilterSet)
    qualifiers = QualifierFilter(QualifierType)
    reservation_purposes = ReservationPurposeFilter(ReservationPurposeType)

    terms_of_use = TermsOfUseFilter(TermsOfUseType)
    tax_percentages = TaxPercentageFilter(TaxPercentageType)
    age_groups = AgeGroupFilter(AgeGroupType)
    cities = CityNode.Connection()
    metadata_sets = ReservationMetadataSetFilter(ReservationMetadataSetType)

    order = Field(PaymentOrderType, order_uuid=graphene.String())

    banner_notification = BannerNotificationNode.Node()
    banner_notifications = BannerNotificationNode.Connection()

    if "graphiql_debug_toolbar" in settings.INSTALLED_APPS:
        debug = Field(DjangoDebug, name="_debug")

    def resolve_current_user(self, info, **kwargs):
        return get_object_or_404(User, pk=info.context.user.pk)

    @check_resolver_permission(UserPermission, raise_permission_error=True)
    def resolve_user(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(User, pk=pk)

    @check_resolver_permission(ReservationPermission)
    def resolve_reservation_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Reservation, pk=pk)

    @check_resolver_permission(ReservationUnitPermission)
    def resolve_reservation_unit_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(ReservationUnit, pk=pk)

    def resolve_reservation_unit_hauki_url(self, info, **kwargs):
        pk = kwargs.get("pk")

        reservation_unit = get_object_or_404(ReservationUnit, pk=pk)

        res_units_to_include = kwargs.get("reservation_units")
        url_type = ReservationUnitHaukiUrlType(
            instance=reservation_unit, include_reservation_units=res_units_to_include
        )

        return url_type

    @check_resolver_permission(ResourcePermission)
    def resolve_resource_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Resource, pk=pk)

    @check_resolver_permission(UnitPermission)
    def resolve_unit_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Unit, pk=pk)

    @check_resolver_permission(SpacePermission)
    def resolve_space_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Space, pk=pk)

    @check_resolver_permission(EquipmentPermission)
    def resolve_equipment_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(Equipment, pk=pk)

    @check_resolver_permission(EquipmentCategoryPermission)
    def resolve_equipment_category_by_pk(self, info, **kwargs):
        pk = kwargs.get("pk")
        return get_object_or_404(EquipmentCategory, pk=pk)

    @check_resolver_permission(PaymentOrderPermission)
    def resolve_order(self, info, **kwargs):
        remote_id = kwargs.get("order_uuid")
        order = get_object_or_404(PaymentOrder, remote_id=remote_id)
        if (
            can_handle_reservation(info.context.user, order.reservation)
            or order.reservation.user_id == info.context.user.id
        ):
            return order
        return None

    def resolve_banner_notifications(root: None, info: GQLInfo, **kwargs: Any):
        can_see_all = can_manage_banner_notifications(info.context.user)
        if can_see_all:
            return BannerNotification.objects.all()
        if kwargs.get("is_visible", False):
            return BannerNotification.objects.visible(info.context.user)
        return BannerNotification.objects.none()


class Mutation(graphene.ObjectType):
    create_application = ApplicationCreateMutation.Field()
    update_application = ApplicationUpdateMutation.Field()
    decline_application = ApplicationDeclineMutation.Field()
    send_application = ApplicationSendMutation.Field()
    cancel_application = ApplicationCancelMutation.Field()

    create_application_event = ApplicationEventCreateMutation.Field()
    update_application_event = ApplicationEventUpdateMutation.Field()
    delete_application_event = ApplicationEventDeleteMutation.Field()
    decline_application_event = ApplicationEventDeclineMutation.Field()

    approve_application_event_schedule = ApplicationEventScheduleApproveMutation.Field()
    decline_application_event_schedule = ApplicationEventScheduleDeclineMutation.Field()
    reset_application_event_schedule = ApplicationEventScheduleResetMutation.Field()

    create_recurring_reservation = RecurringReservationCreateMutation.Field()
    update_recurring_reservation = RecurringReservationUpdateMutation.Field()

    create_reservation = ReservationCreateMutation.Field()
    create_staff_reservation = ReservationStaffCreateMutation.Field()
    update_reservation = ReservationUpdateMutation.Field()
    confirm_reservation = ReservationConfirmMutation.Field()
    cancel_reservation = ReservationCancellationMutation.Field()
    deny_reservation = ReservationDenyMutation.Field()
    delete_reservation = ReservationDeleteMutation.Field()
    approve_reservation = ReservationApproveMutation.Field()
    refund_reservation = ReservationRefundMutation.Field()
    require_handling_for_reservation = ReservationRequiresHandlingMutation.Field()
    update_reservation_working_memo = ReservationWorkingMemoMutation.Field()
    adjust_reservation_time = ReservationAdjustTimeMutation.Field()
    staff_adjust_reservation_time = ReservationStaffAdjustTimeMutation.Field()
    staff_reservation_modify = ReservationStaffModifyMutation.Field()

    create_reservation_unit = ReservationUnitCreateMutation.Field()
    update_reservation_unit = ReservationUnitUpdateMutation.Field()

    create_reservation_unit_image = ReservationUnitImageCreateMutation.Field()
    update_reservation_unit_image = ReservationUnitImageUpdateMutation.Field()
    delete_reservation_unit_image = ReservationUnitImageDeleteMutation.Field()

    create_purpose = PurposeCreateMutation.Field()
    update_purpose = PurposeUpdateMutation.Field()

    create_equipment = EquipmentCreateMutation.Field()
    update_equipment = EquipmentUpdateMutation.Field()
    delete_equipment = EquipmentDeleteMutation.Field()

    create_equipment_category = EquipmentCategoryCreateMutation.Field()
    update_equipment_category = EquipmentCategoryUpdateMutation.Field()
    delete_equipment_category = EquipmentCategoryDeleteMutation.Field()

    create_space = SpaceCreateMutation.Field()
    update_space = SpaceUpdateMutation.Field()
    delete_space = SpaceDeleteMutation.Field()

    create_resource = ResourceCreateMutation.Field()
    update_resource = ResourceUpdateMutation.Field()
    delete_resource = ResourceDeleteMutation.Field()

    update_unit = UnitUpdateMutation.Field()

    update_user = UserUpdateMutation.Field()

    refresh_order = RefreshOrderMutation.Field()

    create_banner_notification = BannerNotificationCreateMutation.Field()
    update_banner_notification = BannerNotificationUpdateMutation.Field()
    delete_banner_notification = BannerNotificationDeleteMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
