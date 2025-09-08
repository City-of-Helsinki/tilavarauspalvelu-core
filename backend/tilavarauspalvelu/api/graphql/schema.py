import datetime
import uuid
from inspect import cleandoc
from typing import Any, TypedDict

from django.contrib.auth import logout
from undine import Entrypoint, GQLInfo, RootType, create_schema
from undine.exceptions import GraphQLModelNotFoundError
from undine.optimizer.optimizer import optimize_sync
from undine.relay import Connection, Node

from tilavarauspalvelu.enums import ReservationCancelReasonChoice, ReservationStateChoice, UserPermissionChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.helsinki_profile.typing import PermissionCheckResult, UserProfileInfo
from tilavarauspalvelu.models import AllocatedTimeSlot, PaymentOrder, Reservation, User
from tilavarauspalvelu.translation import translated
from utils.date_utils import local_end_of_day, local_start_of_day

from .types import (
    AgeGroupNode,
    AllocatedTimeSlotCreateMutation,
    AllocatedTimeSlotDeleteMutation,
    AllocatedTimeSlotNode,
    ApplicationCancelMutation,
    ApplicationCreateMutation,
    ApplicationNode,
    ApplicationRoundNode,
    ApplicationSectionNode,
    ApplicationSectionReservationCancellationMutation,
    ApplicationSendMutation,
    ApplicationUpdateMutation,
    ApplicationWorkingMemoMutation,
    BannerNotificationCreateMutation,
    BannerNotificationDeleteMutation,
    BannerNotificationNode,
    BannerNotificationUpdateMutation,
    EquipmentCategoryNode,
    EquipmentNode,
    PaymentOrderNode,
    PurposeNode,
    RejectAllApplicationOptionsMutation,
    RejectAllSectionOptionsMutation,
    RejectedOccurrenceNode,
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancelMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteTentativeMutation,
    ReservationDenyMutation,
    ReservationDenyReasonNode,
    ReservationMetadataSetNode,
    ReservationNode,
    ReservationPurposeNode,
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
    ReservationUnitAllNode,
    ReservationUnitArchiveMutation,
    ReservationUnitCancellationRuleNode,
    ReservationUnitCreateMutation,
    ReservationUnitImageCreateMutation,
    ReservationUnitImageDeleteMutation,
    ReservationUnitImageUpdateMutation,
    ReservationUnitNode,
    ReservationUnitOptionUpdateMutation,
    ReservationUnitTypeNode,
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
    TaxPercentageNode,
    TermsOfUseNode,
    UnitAllNode,
    UnitGroupNode,
    UnitNode,
    UserNode,
)
from .types.helsinki_profile.queries import HelsinkiProfileResolver
from .types.reservation_unit.queries.pagination import ReservationConnection


class ReservationCancelReasonType(TypedDict):
    value: ReservationCancelReasonChoice
    reason_fi: str
    reason_en: str
    reason_sv: str


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

    affecting_allocated_time_slots = Entrypoint(
        AllocatedTimeSlotNode,
        many=True,
        description=cleandoc(
            """
            Return all allocations that affect allocations for the given reservation unit
            (through space hierarchy or common resource) during the given time period.
            """
        ),
    )

    @affecting_allocated_time_slots.resolve
    def resolve_affecting_allocated_time_slots(
        self,
        info: GQLInfo[User],
        *,
        reservation_unit: int,
        begin_date: datetime.date,
        end_date: datetime.date,
    ) -> list[AllocatedTimeSlot]:
        # TODO: Could be a Filter on AllocatedTimeSlotFilterSet?
        queryset = AllocatedTimeSlot.objects.all().affecting_allocations(reservation_unit, begin_date, end_date)
        return optimize_sync(queryset, info)

    # --------------------------------------------------------------------------------
    # Reservation units
    # --------------------------------------------------------------------------------

    units = Entrypoint(Connection(UnitNode))
    reservation_units = Entrypoint(ReservationConnection(ReservationUnitNode))
    reservation_unit_cancellation_rules = Entrypoint(Connection(ReservationUnitCancellationRuleNode))

    # --------------------------------------------------------------------------------
    # Reservations
    # --------------------------------------------------------------------------------

    reservations = Entrypoint(Connection(ReservationNode))
    rejected_occurrences = Entrypoint(Connection(RejectedOccurrenceNode))

    order = Entrypoint(PaymentOrderNode)

    @order.resolve
    def resolve_order(self, info: GQLInfo[User], *, order_uuid: uuid.UUID) -> PaymentOrder:
        queryset = PaymentOrder.objects.filter(reservation__isnull=False)

        order = optimize_sync(queryset, info, remote_id=order_uuid)
        if order is None:
            msg = f"PaymentOrder {str(order_uuid)!r} does not exist."
            raise GraphQLModelNotFoundError(msg)

        return order

    affecting_reservations = Entrypoint(
        ReservationNode,
        many=True,
        description=cleandoc(
            """
            Find all reservations that affect other reservations through the space hierarchy or a common resource.
            """
        ),
    )

    @affecting_reservations.resolve
    def resolve_affecting_reservations(
        self,
        info: GQLInfo[User],
        *,
        begin_date: datetime.date,
        end_date: datetime.date,
        state: list[ReservationStateChoice] | None = None,
        for_units: list[int] | None = None,
        for_reservation_units: list[int] | None = None,
    ) -> list[Reservation]:
        # TODO: Could be a Filter on ReservationFilterSet?
        queryset = (
            Reservation.objects.all()
            .affecting_reservations(
                units=for_units or [],
                reservation_units=for_reservation_units or [],
            )
            .filter(
                ends_at__gte=local_start_of_day(begin_date),
                begins_at__lte=local_end_of_day(end_date),
            )
        )
        if state is not None:
            queryset = queryset.filter(state__in=state)

        return optimize_sync(queryset, info)

    # --------------------------------------------------------------------------------
    # Dropdown options
    # --------------------------------------------------------------------------------

    all_units = Entrypoint(UnitAllNode, many=True)
    all_unit_groups = Entrypoint(UnitGroupNode, many=True)
    all_equipments = Entrypoint(EquipmentNode, many=True)
    all_equipment_categories = Entrypoint(EquipmentCategoryNode, many=True)
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
    def resolve_current_user(self, info: GQLInfo[User]) -> User | None:
        if not info.context.user.is_active:
            logout(info.context)
            return None

        if info.context.user.is_anonymous:
            return None

        HelsinkiProfileClient.ensure_token_valid(user=info.context.user, session=info.context.session)

        return optimize_sync(User.objects.all(), info, pk=info.context.user.pk)

    @current_user.permissions
    def current_user_permissions(root: Any, info: GQLInfo[User], value: User) -> None:  # noqa: ARG002
        """Always allow current user access."""
        return

    @Entrypoint
    def check_permissions(
        self,
        info: GQLInfo[User],
        *,
        permission: UserPermissionChoice,
        units: list[int] | None = None,
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
            unit_ids=units or [],
            require_all=require_all,
        )

        return PermissionCheckResult(has_permission=has_permission)

    @Entrypoint
    def profile_data(
        self,
        info: GQLInfo[User],
        *,
        application_pk: int | None = None,
        reservation_pk: int | None = None,
    ) -> UserProfileInfo:
        """
        Get information about a user from Helsinki profile.
        If user is not a profile user, still return data stored in our database, e.g. first and last name.

        Use only one of 'reservationPk' or 'applicationPk' to select the user.
        This determines the required permissions to view the user's data.
        If neither is given, the user is the currently logged in user.

        :param application_pk: View profile data for this application's user.
        :param reservation_pk: View profile data for this reservation's user.
        """
        if reservation_pk is not None:
            user = HelsinkiProfileResolver.get_user_from_reservation(reservation_pk, info)
        elif application_pk is not None:
            user = HelsinkiProfileResolver.get_user_from_application(application_pk, info)
        else:
            user = info.context.user

        return HelsinkiProfileResolver.resolve(info, user)

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
    archive_reservation_unit = Entrypoint(ReservationUnitArchiveMutation)
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
    cancel_reservation = Entrypoint(ReservationCancelMutation)
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
