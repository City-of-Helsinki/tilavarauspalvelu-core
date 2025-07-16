from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib.auth import logout
from undine import Entrypoint, RootType, create_schema
from undine.exceptions import GraphQLModelNotFoundError
from undine.optimizer.optimizer import optimize_sync
from undine.relay import Connection, Node

from tilavarauspalvelu.enums import ReservationCancelReasonChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import PermissionCheckResult
from tilavarauspalvelu.models import AllocatedTimeSlot, PaymentOrder, Reservation, User
from tilavarauspalvelu.translation import translated

from .types.age_group.queries import AgeGroupNode
from .types.allocated_time_slot.mutations import AllocatedTimeSlotCreateMutation, AllocatedTimeSlotDeleteMutation
from .types.allocated_time_slot.queries import AllocatedTimeSlotNode
from .types.application.mutations import (
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    ApplicationWorkingMemoMutation,
    RejectAllApplicationOptionsMutation,
    RestoreAllApplicationOptionsMutation,
)
from .types.application.queries import ApplicationNode
from .types.application_round.mutations import (
    SetApplicationRoundHandledMutation,
    SetApplicationRoundResultsSentMutation,
)
from .types.application_round.queries import ApplicationRoundNode
from .types.application_section.mutations import RejectAllSectionOptionsMutation, RestoreAllSectionOptionsMutation
from .types.application_section.mutations.cancel_section_reservations import (
    ApplicationSectionReservationCancellationMutation,
)
from .types.application_section.queries import ApplicationSectionNode
from .types.banner_notification.mutations import (
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationUpdateMutation,
)
from .types.banner_notification.types import BannerNotificationNode
from .types.equipment.types import EquipmentAllNode
from .types.helsinki_profile.types import HelsinkiProfileDataNode
from .types.payment_order.types import PaymentOrderNode
from .types.purpose.types import PurposeNode
from .types.rejected_occurrence.types import RejectedOccurrenceNode
from .types.reservation.mutations import (
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteTentativeMutation,
    ReservationDenyMutation,
    ReservationRefundMutation,
    ReservationRequiresHandlingMutation,
    ReservationStaffAdjustTimeMutation,
    ReservationStaffChangeAccessCodeMutation,
    ReservationStaffCreateMutation,
    ReservationStaffModifyMutation,
    ReservationStaffRepairAccessCodeMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
)
from .types.reservation.types import ReservationNode
from .types.reservation_cancel_reason.types import ReservationCancelReasonType
from .types.reservation_deny_reason.types import ReservationDenyReasonNode
from .types.reservation_metadata.types import ReservationMetadataSetNode
from .types.reservation_purpose.types import ReservationPurposeNode
from .types.reservation_series.mutations import (
    ReservationSeriesAddMutation,
    ReservationSeriesChangeAccessCodeMutation,
    ReservationSeriesCreateMutation,
    ReservationSeriesDenyMutation,
    ReservationSeriesRepairAccessCodeMutation,
    ReservationSeriesRescheduleMutation,
    ReservationSeriesUpdateMutation,
)
from .types.reservation_unit.mutations import ReservationUnitCreateMutation, ReservationUnitUpdateMutation
from .types.reservation_unit.types import ReservationUnitAllNode, ReservationUnitNode
from .types.reservation_unit_cancellation_rule.types import ReservationUnitCancellationRuleNode
from .types.reservation_unit_image.mutations import (
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
)
from .types.reservation_unit_option.mutations import ReservationUnitOptionUpdateMutation
from .types.reservation_unit_type.types import ReservationUnitTypeNode
from .types.resource.mutations import ResourceCreateMutation, ResourceDeleteMutation, ResourceUpdateMutation
from .types.space.mutations import SpaceCreateMutation, SpaceDeleteMutation, SpaceUpdateMutation
from .types.tax_percentage.types import TaxPercentageNode
from .types.terms_of_use.types import TermsOfUseNode
from .types.unit.types import UnitAllNode, UnitNode
from .types.unit_group.types import UnitGroupNode
from .types.user.types import UserNode

if TYPE_CHECKING:
    import datetime

    from django.db import models

    from tilavarauspalvelu.enums import UserPermissionChoice
    from tilavarauspalvelu.integrations.helsinki_profile.typing import UserProfileInfo
    from tilavarauspalvelu.typing import GQLInfo


class Query(RootType):
    # --------------------------------------------------------------------------------
    # Node interface
    # --------------------------------------------------------------------------------

    node = Entrypoint(Node)

    # --------------------------------------------------------------------------------
    # Seasonal booking
    # --------------------------------------------------------------------------------

    application_rounds = Entrypoint(Connection(ApplicationRoundNode))
    applications = Entrypoint(Connection(ApplicationNode))
    application_sections = Entrypoint(Connection(ApplicationSectionNode))
    allocated_time_slots = Entrypoint(Connection(AllocatedTimeSlotNode))

    affecting_allocated_time_slots = Entrypoint(AllocatedTimeSlotNode, many=True)
    """
    Return all allocations that affect allocations for the given reservation unit
    (through space hierarchy or common resource) during the given time period.
    """

    @affecting_allocated_time_slots.resolve
    def resolve_affecting_allocated_time_slots(
        self,
        info: GQLInfo,
        *,
        reservation_unit: int,
        begin_date: datetime.date,
        end_date: datetime.date,
    ) -> list[AllocatedTimeSlot]:
        queryset: models.QuerySet[AllocatedTimeSlot]
        queryset = AllocatedTimeSlot.objects.all().affecting_allocations(reservation_unit, begin_date, end_date)
        return optimize_sync(queryset, info)

    # --------------------------------------------------------------------------------
    # Reservation units
    # --------------------------------------------------------------------------------

    units = Entrypoint(Connection(UnitNode))
    reservation_units = Entrypoint(Connection(ReservationUnitNode))
    reservation_unit_cancellation_rules = Entrypoint(Connection(ReservationUnitCancellationRuleNode))

    # --------------------------------------------------------------------------------
    # Reservations
    # --------------------------------------------------------------------------------

    reservations = Entrypoint(Connection(ReservationNode))
    rejected_occurrences = Entrypoint(Connection(RejectedOccurrenceNode))

    # TODO: Could these be their own reference? E.g. "FilteredQueryType[PaymentOrderNode]"?
    order = Entrypoint(PaymentOrderNode, nullable=True)

    @order.resolve
    def resolve_order(self, info: GQLInfo, *, order_uuid: str) -> PaymentOrder | None:
        queryset: models.QuerySet[PaymentOrder]
        queryset = PaymentOrder.objects.all().filter(reservation__isnull=False)

        order = optimize_sync(queryset, info, remote_id=order_uuid)
        if order is None:
            msg = f"PaymentOrder {order_uuid!r} does not exist."
            raise GraphQLModelNotFoundError(msg)

        return order

    affecting_reservations = Entrypoint(ReservationNode, many=True)
    """Find all reservations that affect other reservations through the space hierarchy or a common resource."""

    @affecting_reservations.resolve
    def resolve_affecting_reservations(
        self,
        info: GQLInfo,
        *,
        for_units: list[int] | None = None,
        for_reservation_units: list[int] | None = None,
    ) -> list[Reservation]:
        queryset: models.QuerySet[Reservation]
        queryset = Reservation.objects.all().affecting_reservations(for_units or [], for_reservation_units or [])
        return optimize_sync(queryset, info)

    # --------------------------------------------------------------------------------
    # Dropdown options
    # --------------------------------------------------------------------------------

    all_units = Entrypoint(UnitAllNode, many=True)
    all_unit_groups = Entrypoint(UnitGroupNode, many=True)
    all_equipments = Entrypoint(EquipmentAllNode, many=True)
    all_reservation_units = Entrypoint(ReservationUnitAllNode, many=True)
    all_tax_percentages = Entrypoint(TaxPercentageNode, many=True)
    all_purposes = Entrypoint(PurposeNode, many=True)
    all_metadata_sets = Entrypoint(ReservationMetadataSetNode, many=True)
    all_reservation_unit_types = Entrypoint(ReservationUnitTypeNode, many=True)
    all_age_groups = Entrypoint(AgeGroupNode, many=True)
    all_reservation_deny_reasons = Entrypoint(ReservationDenyReasonNode, many=True)
    all_reservation_purposes = Entrypoint(ReservationPurposeNode, many=True)
    all_terms_of_use = Entrypoint(TermsOfUseNode, many=True)

    @Entrypoint
    def all_reservation_cancel_reasons(self) -> list[ReservationCancelReasonType]:
        return [
            ReservationCancelReasonType(
                value=reason.value,
                reason_fi=translated(reason.label, "fi"),
                reason_en=translated(reason.label, "en"),
                reason_sv=translated(reason.label, "sv"),
            )
            for reason in ReservationCancelReasonChoice.user_selectable
        ]

    # --------------------------------------------------------------------------------
    # User
    # --------------------------------------------------------------------------------

    current_user = Entrypoint(UserNode, nullable=True)

    @current_user.resolve
    def resolve_current_user(self, info: GQLInfo) -> User | None:
        if not info.context.user.is_active:
            logout(info.context)
            return None

        if info.context.user.is_anonymous:
            return None

        HelsinkiProfileClient.ensure_token_valid(user=info.context.user, session=info.context.session)

        return optimize_sync(User.objects.all(), info, pk=info.context.user.pk)

    @Entrypoint
    def check_permissions(
        self,
        info: GQLInfo,
        *,
        permission: UserPermissionChoice,
        units: list[int],
        require_all: bool = False,
    ) -> PermissionCheckResult:
        user = info.context.user

        # Anonymous or inactive users have no permissions
        if user.permissions.is_user_anonymous_or_inactive():
            return PermissionCheckResult(has_permission=False)

        # Superusers have all permissions
        if user.is_superuser:
            return PermissionCheckResult(has_permission=True)

        # Has the given permission through their general roles
        if permission in user.active_general_permissions:
            return PermissionCheckResult(has_permission=True)

        has_permission = user.permissions.has_permission_for_unit_or_their_unit_group(
            permission=permission,
            unit_ids=units,
            require_all=require_all,
        )

        return PermissionCheckResult(has_permission=has_permission)

    @Entrypoint
    def profile_data(
        self,
        info: GQLInfo,
        *,
        application_pk: int | None = None,
        reservation_pk: int | None = None,
    ) -> UserProfileInfo:
        """
        Get information about a user from Helsinki profile.
        If user is not a profile user, still return data stored in our database, e.g. first and last name.
        Use only one of 'reservation_pk' or 'application_pk' to select the user.
        This determines the required permissions to view the user's data.

        :param application_pk: View profile data for this application's user.
        :param reservation_pk: View profile data for this reservation's user.
        """
        return HelsinkiProfileDataNode.get_data(info, application_pk=application_pk, reservation_pk=reservation_pk)

    # --------------------------------------------------------------------------------
    # Banner notifications
    # --------------------------------------------------------------------------------

    banner_notifications = Entrypoint(Connection(BannerNotificationNode))


class Mutation(RootType):
    # --------------------------------------------------------------------------------
    # Seasonal booking
    # --------------------------------------------------------------------------------

    create_application = Entrypoint(ApplicationCreateMutation)
    update_application = Entrypoint(ApplicationUpdateMutation)
    send_application = Entrypoint(ApplicationSendMutation)
    cancel_application = Entrypoint(ApplicationCancelMutation)
    update_application_working_memo = Entrypoint(ApplicationWorkingMemoMutation)
    create_allocated_timeslot = Entrypoint(AllocatedTimeSlotCreateMutation)
    delete_allocated_timeslot = Entrypoint(AllocatedTimeSlotDeleteMutation)
    update_reservation_unit_option = Entrypoint(ReservationUnitOptionUpdateMutation)
    reject_all_section_options = Entrypoint(RejectAllSectionOptionsMutation)
    restore_all_section_options = Entrypoint(RestoreAllSectionOptionsMutation)
    reject_all_application_options = Entrypoint(RejectAllApplicationOptionsMutation)
    restore_all_application_options = Entrypoint(RestoreAllApplicationOptionsMutation)
    cancel_all_application_section_reservations = Entrypoint(ApplicationSectionReservationCancellationMutation)
    set_application_round_handled = Entrypoint(SetApplicationRoundHandledMutation)
    set_application_round_results_sent = Entrypoint(SetApplicationRoundResultsSentMutation)

    # --------------------------------------------------------------------------------
    # Reservable entities
    # --------------------------------------------------------------------------------

    create_space = Entrypoint(SpaceCreateMutation)
    update_space = Entrypoint(SpaceUpdateMutation)
    delete_space = Entrypoint(SpaceDeleteMutation)
    create_resource = Entrypoint(ResourceCreateMutation)
    update_resource = Entrypoint(ResourceUpdateMutation)
    delete_resource = Entrypoint(ResourceDeleteMutation)

    # --------------------------------------------------------------------------------
    # Reservation unit
    # --------------------------------------------------------------------------------

    create_reservation_unit = Entrypoint(ReservationUnitCreateMutation)
    update_reservation_unit = Entrypoint(ReservationUnitUpdateMutation)
    create_reservation_unit_image = Entrypoint(ReservationUnitImageCreateMutation)
    update_reservation_unit_image = Entrypoint(ReservationUnitImageUpdateMutation)
    delete_reservation_unit_image = Entrypoint(ReservationUnitImageDeleteMutation)

    # --------------------------------------------------------------------------------
    # Reservations
    # --------------------------------------------------------------------------------

    create_reservation = Entrypoint(ReservationCreateMutation)
    create_staff_reservation = Entrypoint(ReservationStaffCreateMutation)
    update_reservation = Entrypoint(ReservationUpdateMutation)
    confirm_reservation = Entrypoint(ReservationConfirmMutation)
    cancel_reservation = Entrypoint(ReservationCancellationMutation)
    deny_reservation = Entrypoint(ReservationDenyMutation)
    delete_tentative_reservation = Entrypoint(ReservationDeleteTentativeMutation)
    approve_reservation = Entrypoint(ReservationApproveMutation)
    refund_reservation = Entrypoint(ReservationRefundMutation)
    require_handling_for_reservation = Entrypoint(ReservationRequiresHandlingMutation)
    update_reservation_working_memo = Entrypoint(ReservationWorkingMemoMutation)
    adjust_reservation_time = Entrypoint(ReservationAdjustTimeMutation)

    # --------------------------------------------------------------------------------
    # Staff reservations
    # --------------------------------------------------------------------------------

    staff_adjust_reservation_time = Entrypoint(ReservationStaffAdjustTimeMutation)
    staff_reservation_modify = Entrypoint(ReservationStaffModifyMutation)
    staff_change_reservation_access_code = Entrypoint(ReservationStaffChangeAccessCodeMutation)
    staff_repair_reservation_access_code = Entrypoint(ReservationStaffRepairAccessCodeMutation)

    # --------------------------------------------------------------------------------
    # Reservation series
    # --------------------------------------------------------------------------------

    create_reservation_series = Entrypoint(ReservationSeriesCreateMutation)
    update_reservation_series = Entrypoint(ReservationSeriesUpdateMutation)
    add_reservation_to_series = Entrypoint(ReservationSeriesAddMutation)
    reschedule_reservation_series = Entrypoint(ReservationSeriesRescheduleMutation)
    deny_reservation_series = Entrypoint(ReservationSeriesDenyMutation)
    change_reservation_series_access_code = Entrypoint(ReservationSeriesChangeAccessCodeMutation)
    repair_reservation_series_access_code = Entrypoint(ReservationSeriesRepairAccessCodeMutation)

    # --------------------------------------------------------------------------------
    # Banner notifications
    # --------------------------------------------------------------------------------

    create_banner_notification = Entrypoint(BannerNotificationCreateMutation)
    update_banner_notification = Entrypoint(BannerNotificationUpdateMutation)
    delete_banner_notification = Entrypoint(BannerNotificationDeleteMutation)


schema = create_schema(query=Query, mutation=Mutation)
