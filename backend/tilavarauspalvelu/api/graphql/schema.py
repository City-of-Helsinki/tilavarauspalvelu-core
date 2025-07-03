from __future__ import annotations

from typing import TYPE_CHECKING, Any

import graphene
from django.contrib.auth import logout
from graphene import Field
from graphene_django_extensions.errors import GQLNotFoundError
from query_optimizer import DjangoListField, optimize_single
from query_optimizer.compiler import optimize

from tilavarauspalvelu.enums import ReservationCancelReasonChoice, UserPermissionChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.models import AllocatedTimeSlot, PaymentOrder, Reservation, User
from tilavarauspalvelu.models.banner_notification.model import BannerNotification
from tilavarauspalvelu.translation import translated

from .mutations import (
    AllocatedTimeSlotCreateMutation,
    AllocatedTimeSlotDeleteMutation,
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSectionCreateMutation,
    ApplicationSectionDeleteMutation,
    ApplicationSectionReservationCancellationMutation,
    ApplicationSectionUpdateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    ApplicationWorkingMemoMutation,
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
    CurrentUserUpdateMutation,
    EquipmentCategoryCreateMutation,
    EquipmentCategoryDeleteMutation,
    EquipmentCategoryUpdateMutation,
    EquipmentCreateMutation,
    EquipmentDeleteMutation,
    EquipmentUpdateMutation,
    PurposeCreateMutation,
    PurposeUpdateMutation,
    RejectAllApplicationOptionsMutation,
    RejectAllSectionOptionsMutation,
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteMutation,
    ReservationDeleteTentativeMutation,
    ReservationDenyMutation,
    ReservationRefundMutation,
    ReservationRequiresHandlingMutation,
    ReservationSeriesAddMutation,
    ReservationSeriesChangeAccessCodeMutation,
    ReservationSeriesCreateMutation,
    ReservationSeriesDenyMutation,
    ReservationSeriesRepairAccessCodeMutation,
    ReservationSeriesRescheduleMutation,
    ReservationSeriesUpdateMutation,
    ReservationStaffAdjustTimeMutation,
    ReservationStaffChangeAccessCodeMutation,
    ReservationStaffCreateMutation,
    ReservationStaffModifyMutation,
    ReservationStaffRepairAccessCodeMutation,
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
    RestoreAllApplicationOptionsMutation,
    RestoreAllSectionOptionsMutation,
    SetApplicationRoundHandledMutation,
    SetApplicationRoundResultsSentMutation,
    SpaceCreateMutation,
    SpaceDeleteMutation,
    SpaceUpdateMutation,
    UnitUpdateMutation,
    UserStaffUpdateMutation,
)
from .queries import (
    AgeGroupNode,
    AllocatedTimeSlotNode,
    ApplicationNode,
    ApplicationRoundNode,
    ApplicationSectionNode,
    BannerNotificationNode,
    CityNode,
    EquipmentAllNode,
    EquipmentCategoryNode,
    EquipmentNode,
    HelsinkiProfileDataNode,
    PaymentOrderNode,
    PermissionCheckerType,
    PurposeNode,
    RecurringReservationNode,
    RejectedOccurrenceNode,
    ReservationCancelReasonType,
    ReservationDenyReasonNode,
    ReservationMetadataSetNode,
    ReservationNode,
    ReservationPurposeNode,
    ReservationUnitAllNode,
    ReservationUnitCancellationRuleNode,
    ReservationUnitNode,
    ReservationUnitTypeNode,
    ResourceNode,
    SpaceNode,
    TaxPercentageNode,
    TermsOfUseNode,
    UnitAllNode,
    UnitGroupNode,
    UnitNode,
    UserNode,
)
from .types.payment_order.permissions import PaymentOrderPermission
from .types.reservation_cancel_reason.types import CancelReasonDict

if TYPE_CHECKING:
    import datetime
    from collections.abc import Collection

    from django.db import models

    from tilavarauspalvelu.integrations.helsinki_profile.typing import UserProfileInfo
    from tilavarauspalvelu.typing import AnyUser, GQLInfo


class Query(graphene.ObjectType):
    #
    # Seasonal booking
    application_round = ApplicationRoundNode.Node()
    application_rounds = ApplicationRoundNode.Connection()
    application = ApplicationNode.Node()
    applications = ApplicationNode.Connection()
    application_section = ApplicationSectionNode.Node()
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
    units_all = UnitAllNode.ListField()
    resource = ResourceNode.Node()
    resources = ResourceNode.Connection()
    space = SpaceNode.Node()
    spaces = SpaceNode.Connection()
    equipment = EquipmentNode.Node()
    equipments = EquipmentNode.Connection()
    equipments_all = EquipmentAllNode.ListField()
    equipment_category = EquipmentCategoryNode.Node()
    equipment_categories = EquipmentCategoryNode.Connection()
    #
    # Reservation units
    reservation_unit = ReservationUnitNode.Node()
    reservation_units = ReservationUnitNode.Connection()
    reservation_units_all = ReservationUnitAllNode.ListField()
    reservation_unit_types = ReservationUnitTypeNode.Connection()
    reservation_unit_cancellation_rules = ReservationUnitCancellationRuleNode.Connection()
    tax_percentages = TaxPercentageNode.Connection()
    metadata_sets = ReservationMetadataSetNode.Connection()
    purposes = PurposeNode.Connection()
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
    rejected_occurrence = RejectedOccurrenceNode.Node()
    rejected_occurrences = RejectedOccurrenceNode.Connection()
    reservation_cancel_reasons = Field(graphene.List(graphene.NonNull(ReservationCancelReasonType)), required=True)
    reservation_deny_reasons = ReservationDenyReasonNode.Connection()
    reservation_purposes = ReservationPurposeNode.Connection()
    age_groups = AgeGroupNode.Connection()
    cities = CityNode.Connection()
    order = Field(PaymentOrderNode, order_uuid=graphene.String(required=True))
    #
    # User
    user = UserNode.Node()
    current_user = UserNode.Field()
    check_permissions = Field(
        PermissionCheckerType,
        permission=graphene.NonNull(graphene.Enum.from_enum(UserPermissionChoice)),
        units=graphene.List(graphene.NonNull(graphene.Int)),
        require_all=graphene.Argument(graphene.Boolean, default_value=False),
    )
    profile_data = Field(
        HelsinkiProfileDataNode,
        application_pk=graphene.Int(description="View profile data for this application's user."),
        reservation_pk=graphene.Int(description="View profile data for this reservation's user."),
        description=(
            "Get information about a user from Helsinki profile. "
            "If user is not a profile user, still return data stored in our database, e.g. first and last name. "
            "Use only one of 'reservation_pk' or 'application_pk' to select the user. "
            "This determines the required permissions to view the user's data."
        ),
    )
    #
    # Misc.
    terms_of_use = TermsOfUseNode.Connection()
    banner_notification = BannerNotificationNode.Node()
    banner_notifications = BannerNotificationNode.Connection()
    unit_groups = UnitGroupNode.Connection()

    def resolve_current_user(root: None, info: GQLInfo, **kwargs: Any) -> User | None:
        if not info.context.user.is_active:
            logout(info.context)
            return None

        if info.context.user.is_anonymous:
            return None

        HelsinkiProfileClient.ensure_token_valid(user=info.context.user, session=info.context.session)
        return optimize_single(User.objects.all(), info, max_complexity=15, pk=info.context.user.pk)

    def resolve_profile_data(root: None, info: GQLInfo, **kwargs: Any) -> UserProfileInfo:
        reservation_pk: int | None = kwargs.get("reservation_pk")
        application_pk: int | None = kwargs.get("application_pk")
        return HelsinkiProfileDataNode.get_data(info, application_pk=application_pk, reservation_pk=reservation_pk)

    def resolve_order(root: None, info: GQLInfo, *, order_uuid: str, **kwargs: Any) -> PaymentOrder | None:
        queryset = optimize(PaymentOrder.objects.filter(remote_id=order_uuid, reservation__isnull=False), info)
        order = next(iter(queryset), None)  # Avoids adding additional ordering.
        if order is None:
            msg = f"PaymentOrder-object with orderUuid='{order_uuid}' does not exist."
            raise GQLNotFoundError(msg)

        if PaymentOrderPermission.has_node_permission(order, info.context.user, {}):
            return order
        return None

    def resolve_check_permissions(root: None, info: GQLInfo, **kwargs: Any) -> dict[str, bool]:
        return PermissionCheckerType.run(
            user=info.context.user,
            permission=UserPermissionChoice(kwargs["permission"]),
            unit_ids=kwargs.get("units", []),
            require_all=kwargs.get("require_all", False),
        )

    def resolve_banner_notifications(root: None, info: GQLInfo, **kwargs: Any) -> models.QuerySet[BannerNotification]:
        user: AnyUser = info.context.user
        if user.permissions.can_manage_notifications():
            return BannerNotification.objects.all()
        if kwargs.get("is_visible"):
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

    def resolve_reservation_cancel_reasons(root: None, info: GQLInfo, **kwargs: Any) -> list[CancelReasonDict]:
        return [
            CancelReasonDict(
                value=reason.value,
                reason_fi=translated(reason.label, "fi"),
                reason_en=translated(reason.label, "en"),
                reason_sv=translated(reason.label, "sv"),
            )
            for reason in ReservationCancelReasonChoice.user_selectable
        ]


class Mutation(graphene.ObjectType):
    #
    # Seasonal booking
    create_application = ApplicationCreateMutation.Field()
    update_application = ApplicationUpdateMutation.Field()
    send_application = ApplicationSendMutation.Field()
    cancel_application = ApplicationCancelMutation.Field()
    update_application_working_memo = ApplicationWorkingMemoMutation.Field()
    create_application_section = ApplicationSectionCreateMutation.Field()
    update_application_section = ApplicationSectionUpdateMutation.Field()
    delete_application_section = ApplicationSectionDeleteMutation.Field()
    create_allocated_timeslot = AllocatedTimeSlotCreateMutation.Field()
    delete_allocated_timeslot = AllocatedTimeSlotDeleteMutation.Field()
    update_reservation_unit_option = ReservationUnitOptionUpdateMutation.Field()
    reject_all_section_options = RejectAllSectionOptionsMutation.Field()
    restore_all_section_options = RestoreAllSectionOptionsMutation.Field()
    reject_all_application_options = RejectAllApplicationOptionsMutation.Field()
    restore_all_application_options = RestoreAllApplicationOptionsMutation.Field()
    cancel_all_application_section_reservations = ApplicationSectionReservationCancellationMutation.Field()
    set_application_round_handled = SetApplicationRoundHandledMutation.Field()
    set_application_round_results_sent = SetApplicationRoundResultsSentMutation.Field()
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
    delete_reservation = ReservationDeleteMutation.Field(  # TODO: Remove this after frontend is updated.
        deprecation_reason="Renamed to 'deleteTentativeReservation'."
    )
    delete_tentative_reservation = ReservationDeleteTentativeMutation.Field()
    approve_reservation = ReservationApproveMutation.Field()
    refund_reservation = ReservationRefundMutation.Field()
    require_handling_for_reservation = ReservationRequiresHandlingMutation.Field()
    update_reservation_working_memo = ReservationWorkingMemoMutation.Field()
    adjust_reservation_time = ReservationAdjustTimeMutation.Field()
    #
    # Staff reservations
    staff_adjust_reservation_time = ReservationStaffAdjustTimeMutation.Field()
    staff_reservation_modify = ReservationStaffModifyMutation.Field()
    staff_change_reservation_access_code = ReservationStaffChangeAccessCodeMutation.Field()
    staff_repair_reservation_access_code = ReservationStaffRepairAccessCodeMutation.Field()
    #
    # Reservation series
    create_reservation_series = ReservationSeriesCreateMutation.Field()
    update_reservation_series = ReservationSeriesUpdateMutation.Field()
    add_reservation_to_series = ReservationSeriesAddMutation.Field()
    reschedule_reservation_series = ReservationSeriesRescheduleMutation.Field()
    deny_reservation_series = ReservationSeriesDenyMutation.Field()
    change_reservation_series_access_code = ReservationSeriesChangeAccessCodeMutation.Field()
    repair_reservation_series_access_code = ReservationSeriesRepairAccessCodeMutation.Field()
    #
    # User
    update_current_user = CurrentUserUpdateMutation.Field()
    update_staff_user = UserStaffUpdateMutation.Field()
    #
    # Misc.
    create_banner_notification = BannerNotificationCreateMutation.Field()
    update_banner_notification = BannerNotificationUpdateMutation.Field()
    delete_banner_notification = BannerNotificationDeleteMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
