import datetime
from collections.abc import Collection
from typing import Any

import graphene
from django.conf import settings
from django.db import models
from graphene import Field
from graphene_django.debug import DjangoDebug
from query_optimizer import DjangoListField
from rest_framework.generics import get_object_or_404

from applications.models import AllocatedTimeSlot
from common.models import BannerNotification
from common.typing import GQLInfo
from merchants.models import PaymentOrder
from permissions.helpers import can_manage_banner_notifications
from reservations.models import Reservation
from users.models import User

# NOTE: Queries __need__ to be imported before mutations, see mutations.py!
from .queries import (  # isort:skip
    AllocatedTimeSlotNode,
    ApplicationNode,
    ApplicationRoundNode,
    ApplicationSectionNode,
    BannerNotificationNode,
    CityNode,
    EquipmentCategoryNode,
    EquipmentNode,
    KeywordCategoryNode,
    KeywordGroupNode,
    KeywordNode,
    PaymentOrderNode,
    PurposeNode,
    QualifierNode,
    ReservationNode,
    ReservationUnitCancellationRuleNode,
    ReservationUnitNode,
    ReservationUnitTypeNode,
    ResourceNode,
    SpaceNode,
    TaxPercentageNode,
    TermsOfUseNode,
    UnitNode,
    UserNode,
    AgeGroupNode,
    RecurringReservationNode,
    ReservationCancelReasonNode,
    ReservationDenyReasonNode,
    ReservationMetadataSetNode,
    ReservationPurposeNode,
    ServiceSectorNode,
)
from .types.merchants.permissions import PaymentOrderPermission

from .mutations import (  # isort:skip
    AllocatedTimeSlotCreateMutation,
    AllocatedTimeSlotDeleteMutation,
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSectionCreateMutation,
    ApplicationSectionDeleteMutation,
    ApplicationSectionUpdateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
    PurposeCreateMutation,
    PurposeUpdateMutation,
    RecurringReservationCreateMutation,
    RecurringReservationUpdateMutation,
    RefreshOrderMutation,
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
    ReservationUnitCreateMutation,
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
    ReservationUnitOptionUpdateMutation,
    ReservationUnitUpdateMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
    ResourceCreateMutation,
    ResourceDeleteMutation,
    ResourceUpdateMutation,
    SpaceCreateMutation,
    SpaceDeleteMutation,
    SpaceUpdateMutation,
    UnitUpdateMutation,
    UserUpdateMutation,
)


class Query(graphene.ObjectType):
    #
    # Seasonal booking
    application_round = ApplicationRoundNode.Node()
    application_rounds = ApplicationRoundNode.Connection()
    application = ApplicationNode.Node()
    applications = ApplicationNode.Connection()
    application_sections = ApplicationSectionNode.Connection()
    allocated_time_slots = AllocatedTimeSlotNode.Connection()
    affecting_allocated_time_slots = DjangoListField(
        AllocatedTimeSlotNode,
        reservation_unit=graphene.NonNull(graphene.Int),
        begin_date=graphene.NonNull(graphene.Date),
        end_date=graphene.NonNull(graphene.Date),
        description=(
            "Return all allocations that affect allocations for given reservation unit "
            "(through space hierarchy or common resource) during the given time period."
        ),
        no_filters=True,
    )
    #
    # Reservable entities
    unit = UnitNode.Node()
    units = UnitNode.Connection()
    resource = ResourceNode.Node()
    resources = ResourceNode.Connection()
    space = SpaceNode.Node()
    spaces = SpaceNode.Connection()
    equipment = EquipmentNode.Node()
    equipments = EquipmentNode.Connection()
    equipment_category = EquipmentCategoryNode.Node()
    equipment_categories = EquipmentCategoryNode.Connection()
    #
    # Reservation units
    reservation_unit = ReservationUnitNode.Node()
    reservation_units = ReservationUnitNode.Connection()
    reservation_unit_types = ReservationUnitTypeNode.Connection()
    reservation_unit_cancellation_rules = ReservationUnitCancellationRuleNode.Connection()
    tax_percentages = TaxPercentageNode.Connection()
    metadata_sets = ReservationMetadataSetNode.Connection()
    purposes = PurposeNode.Connection()
    qualifiers = QualifierNode.Connection()
    keyword_categories = KeywordCategoryNode.Connection()
    keyword_groups = KeywordGroupNode.Connection()
    keywords = KeywordNode.Connection()
    #
    # Reservations
    reservation = ReservationNode.Node()
    reservations = ReservationNode.Connection()
    affecting_reservations = DjangoListField(
        ReservationNode,
        description=(
            "Find all reservations that affect other reservations through the space hierarchy or a common resource."
        ),
        for_units=graphene.List(
            graphene.Int,
            default_value=(),
            description="Reservations should contain at least one reservation unit that belongs to any of these units.",
        ),
        for_reservation_units=graphene.List(
            graphene.Int,
            default_value=(),
            description="Reservations should contain at least one these reservation units.",
        ),
    )
    recurring_reservation = RecurringReservationNode.Node()
    recurring_reservations = RecurringReservationNode.Connection()
    reservation_cancel_reasons = ReservationCancelReasonNode.Connection()
    reservation_deny_reasons = ReservationDenyReasonNode.Connection()
    reservation_purposes = ReservationPurposeNode.Connection()
    age_groups = AgeGroupNode.Connection()
    cities = CityNode.Connection()
    order = Field(PaymentOrderNode, order_uuid=graphene.String(required=True))
    #
    # User
    user = UserNode.Node()
    current_user = UserNode.Field()
    #
    # Misc.
    terms_of_use = TermsOfUseNode.Connection()
    banner_notification = BannerNotificationNode.Node()
    banner_notifications = BannerNotificationNode.Connection()
    service_sectors = ServiceSectorNode.Connection()
    #
    # Debug
    if "graphiql_debug_toolbar" in settings.INSTALLED_APPS:
        debug = Field(DjangoDebug, name="_debug")

    def resolve_current_user(root: None, info: GQLInfo, **kwargs: Any):
        return get_object_or_404(User, pk=info.context.user.pk)

    def resolve_order(root: None, info: GQLInfo, **kwargs: Any):
        remote_id: str = kwargs["order_uuid"]
        order = get_object_or_404(PaymentOrder, remote_id=remote_id)
        if PaymentOrderPermission.has_node_permission(order, info.context.user, {}):
            return order
        return None

    def resolve_banner_notifications(root: None, info: GQLInfo, **kwargs: Any):
        can_see_all = can_manage_banner_notifications(info.context.user)
        if can_see_all:
            return BannerNotification.objects.all()
        if kwargs.get("is_visible", False):
            return BannerNotification.objects.visible(info.context.user)
        return BannerNotification.objects.none()

    def resolve_affecting_allocated_time_slots(
        root: None,
        info: GQLInfo,
        reservation_unit: int,
        begin_date: datetime.date,
        end_date: datetime.date,
    ) -> models.QuerySet:
        return AllocatedTimeSlot.objects.affecting_allocations(reservation_unit, begin_date, end_date)

    def resolve_affecting_reservations(
        root: None,
        info: GQLInfo,
        for_units: Collection[int],
        for_reservation_units: Collection[int],
        **kwargs: Any,
    ) -> models.QuerySet:
        return Reservation.objects.affecting_reservations(for_units, for_reservation_units)


class Mutation(graphene.ObjectType):
    #
    # Seasonal booking
    create_application = ApplicationCreateMutation.Field()
    update_application = ApplicationUpdateMutation.Field()
    send_application = ApplicationSendMutation.Field()
    cancel_application = ApplicationCancelMutation.Field()
    create_application_section = ApplicationSectionCreateMutation.Field()
    update_application_section = ApplicationSectionUpdateMutation.Field()
    delete_application_section = ApplicationSectionDeleteMutation.Field()
    create_allocated_timeslot = AllocatedTimeSlotCreateMutation.Field()
    delete_allocated_timeslot = AllocatedTimeSlotDeleteMutation.Field()
    update_reservation_unit_option = ReservationUnitOptionUpdateMutation.Field()
    #
    # Reservable entities
    update_unit = UnitUpdateMutation.Field()
    create_resource = ResourceCreateMutation.Field()
    update_resource = ResourceUpdateMutation.Field()
    delete_resource = ResourceDeleteMutation.Field()
    create_space = SpaceCreateMutation.Field()
    update_space = SpaceUpdateMutation.Field()
    delete_space = SpaceDeleteMutation.Field()
    create_equipment = EquipmentCreateMutation.Field()
    update_equipment = EquipmentUpdateMutation.Field()
    delete_equipment = EquipmentDeleteMutation.Field()
    create_equipment_category = EquipmentCategoryCreateMutation.Field()
    update_equipment_category = EquipmentCategoryUpdateMutation.Field()
    delete_equipment_category = EquipmentCategoryDeleteMutation.Field()
    #
    # Reservation unit
    create_reservation_unit = ReservationUnitCreateMutation.Field()
    update_reservation_unit = ReservationUnitUpdateMutation.Field()
    create_reservation_unit_image = ReservationUnitImageCreateMutation.Field()
    update_reservation_unit_image = ReservationUnitImageUpdateMutation.Field()
    delete_reservation_unit_image = ReservationUnitImageDeleteMutation.Field()
    create_purpose = PurposeCreateMutation.Field()
    update_purpose = PurposeUpdateMutation.Field()
    #
    # Reservations
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
    create_recurring_reservation = RecurringReservationCreateMutation.Field()
    update_recurring_reservation = RecurringReservationUpdateMutation.Field()
    refresh_order = RefreshOrderMutation.Field()
    #
    # User
    update_user = UserUpdateMutation.Field()
    #
    # Misc.
    create_banner_notification = BannerNotificationCreateMutation.Field()
    update_banner_notification = BannerNotificationUpdateMutation.Field()
    delete_banner_notification = BannerNotificationDeleteMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
