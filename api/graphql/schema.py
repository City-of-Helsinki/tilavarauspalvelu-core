import django_filters
import graphene
from django.db.models import Q
from graphene import Field, relay
from graphene_permissions.mixins import AuthFilter
from graphene_permissions.permissions import AllowAuthenticated
from rest_framework.generics import get_object_or_404

from api.graphql.applications.application_filtersets import (
    ApplicationEventFilterSet,
    ApplicationFilterSet,
)
from api.graphql.applications.application_types import (
    ApplicationEventType,
    ApplicationType,
    CityType,
)
from api.graphql.merchants.merchant_mutations import RefreshOrderMutation
from api.graphql.merchants.merchant_types import PaymentOrderType
from api.graphql.reservation_units.reservation_unit_filtersets import (
    EquipmentFilterSet,
    PurposeFilterSet,
    ReservationUnitsFilterSet,
    ReservationUnitTypeFilterSet,
)
from api.graphql.reservation_units.reservation_unit_mutations import (
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
from api.graphql.reservation_units.reservation_unit_types import (
    EquipmentCategoryType,
    EquipmentType,
    KeywordCategoryType,
    KeywordGroupType,
    KeywordType,
    PurposeType,
    QualifierType,
    ReservationUnitByPkType,
    ReservationUnitCancellationRuleType,
    ReservationUnitType,
    ReservationUnitTypeType,
    TaxPercentageType,
)
from api.graphql.reservations.reservation_filtersets import ReservationFilterSet
from api.graphql.reservations.reservation_mutations import (
    ReservationAdjustTimeMutation,
    ReservationApproveMutation,
    ReservationCancellationMutation,
    ReservationConfirmMutation,
    ReservationCreateMutation,
    ReservationDeleteMutation,
    ReservationDenyMutation,
    ReservationRequiresHandlingMutation,
    ReservationStaffCreateMutation,
    ReservationUpdateMutation,
    ReservationWorkingMemoMutation,
)
from api.graphql.reservations.reservation_types import (
    AgeGroupType,
    ReservationCancelReasonType,
    ReservationDenyReasonType,
    ReservationMetadataSetType,
    ReservationPurposeType,
    ReservationType,
)
from api.graphql.resources.resource_mutations import (
    ResourceCreateMutation,
    ResourceDeleteMutation,
    ResourceUpdateMutation,
)
from api.graphql.resources.resource_types import ResourceType
from api.graphql.spaces.space_mutations import (
    SpaceCreateMutation,
    SpaceDeleteMutation,
    SpaceUpdateMutation,
)
from api.graphql.spaces.space_types import ServiceSectorType, SpaceType
from api.graphql.terms_of_use.terms_of_use_types import TermsOfUseType
from api.graphql.units.unit_filtersets import UnitsFilterSet
from api.graphql.units.unit_mutations import UnitUpdateMutation
from api.graphql.units.unit_types import UnitByPkType, UnitType
from api.graphql.users.user_mutations import UserUpdateMutation
from api.graphql.users.user_types import UserType
from merchants.models import PaymentOrder
from permissions.api_permissions.graphene_field_decorators import (
    check_resolver_permission,
)
from permissions.api_permissions.graphene_permissions import (
    AgeGroupPermission,
    ApplicationEventPermission,
    ApplicationPermission,
    ApplicationRoundPermission,
    CityPermission,
    EquipmentCategoryPermission,
    EquipmentPermission,
    KeywordPermission,
    PaymentOrderPermission,
    PurposePermission,
    QualifierPermission,
    ReservationMetadataSetPermission,
    ReservationPermission,
    ReservationPurposePermission,
    ReservationUnitCancellationRulePermission,
    ReservationUnitPermission,
    ResourcePermission,
    ServiceSectorPermission,
    SpacePermission,
    TaxPercentagePermission,
    TermsOfUsePermission,
    UnitPermission,
    UserPermission,
)
from permissions.helpers import (
    can_handle_reservation,
    get_service_sectors_where_can_view_applications,
)
from reservation_units.models import Equipment, EquipmentCategory, ReservationUnit
from reservations.models import Reservation
from resources.models import Resource
from spaces.models import Space, Unit
from users.models import User

from .application_rounds.application_round_types import ApplicationRoundType
from .applications.application_mutations import (
    ApplicationCreateMutation,
    ApplicationDeclineMutation,
    ApplicationEventCreateMutation,
    ApplicationEventDeclineMutation,
    ApplicationEventDeleteMutation,
    ApplicationEventFlagMutation,
    ApplicationEventScheduleResultCreateMutation,
    ApplicationEventScheduleResultUpdateMutation,
    ApplicationEventUpdateMutation,
    ApplicationFlagMutation,
    ApplicationUpdateMutation,
)
from .reservations.recurring_reservation_mutations import (
    RecurringReservationCreateMutation,
    RecurringReservationUpdateMutation,
)


class AllowAuthenticatedFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ApplicationRoundFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ApplicationRoundPermission,)


class ApplicationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ApplicationPermission,)

    @classmethod
    def resolve_queryset(
        cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        queryset = super().resolve_queryset(
            connection, iterable, info, args, filtering_args, filterset_class
        )

        # Filtering queries formation
        user = info.context.user
        unit_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit", flat=True)
        group_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit_group", flat=True)
        units = Unit.objects.filter(
            Q(id__in=unit_ids) | Q(unit_groups__in=group_ids)
        ).values_list("id", flat=True)

        return queryset.filter(
            Q(
                application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(
                application_events__event_reservation_units__reservation_unit__unit__in=units
            )
            | Q(user=user)
        ).distinct()


class ApplicationEventsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ApplicationEventPermission,)

    @classmethod
    def resolve_queryset(
        cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        queryset = super().resolve_queryset(
            connection, iterable, info, args, filtering_args, filterset_class
        )

        # Filtering queries formation
        user = info.context.user
        unit_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit", flat=True)
        group_ids = user.unit_roles.filter(
            role__permissions__permission="can_validate_applications"
        ).values_list("unit_group", flat=True)
        units = Unit.objects.filter(
            Q(id__in=unit_ids) | Q(unit_groups__in=group_ids)
        ).values_list("id", flat=True)

        return queryset.filter(
            Q(
                application__application_round__service_sector__in=get_service_sectors_where_can_view_applications(
                    user
                )
            )
            | Q(event_reservation_units__reservation_unit__unit__in=units)
            | Q(application__user=user)
        ).distinct()


class ReservationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationPermission,)

    @classmethod
    def resolve_queryset(
        cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        queryset = super().resolve_queryset(
            connection, iterable, info, args, filtering_args, filterset_class
        )

        if not args.get("order_by", None):
            queryset = queryset.order_by("begin")
        return queryset


class ReservationUnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)

    @classmethod
    def resolve_queryset(
        cls, connection, iterable, info, args, filtering_args, filterset_class
    ):
        queryset = super().resolve_queryset(
            connection, iterable, info, args, filtering_args, filterset_class
        )
        # Hide archived reservation units
        return queryset.filter(is_archived=False)


class ReservationUnitTypesFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)


class ResourcesFilter(AuthFilter):
    permission_classes = (ResourcePermission,)


class SpacesFilter(AuthFilter):
    permission_classes = (SpacePermission,)


class UnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (UnitPermission,)


class KeywordFilter(AuthFilter):
    permission_classes = (KeywordPermission,)


class EquipmentFilter(AuthFilter):
    permission_classes = (EquipmentPermission,)


class EquipmentCategoryFilter(AuthFilter):
    permission_classes = (EquipmentCategoryPermission,)


class PurposeFilter(AuthFilter):
    permission_classes = (PurposePermission,)


class QualifierFilter(AuthFilter):
    permission_classes = (QualifierPermission,)


class ReservationPurposeFilter(AuthFilter):
    permission_classes = (ReservationPurposePermission,)


class ReservationCancelReasonFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ReservationDenyReasonFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ReservationUnitCancellationRulesFilter(AuthFilter):
    permission_classes = (ReservationUnitCancellationRulePermission,)


class TermsOfUseFilter(AuthFilter):
    permission_classes = (TermsOfUsePermission,)


class TaxPercentageFilter(AuthFilter):
    permission_classes = (TaxPercentagePermission,)


class AgeGroupFilter(AuthFilter):
    permission_classes = (AgeGroupPermission,)


class CityFilter(AuthFilter):
    permission_classes = (CityPermission,)


class ReservationMetadataSetFilter(AuthFilter):
    permission_classes = (ReservationMetadataSetPermission,)


class ServiceSectorFilter(AuthFilter):
    permission_classes = (ServiceSectorPermission,)


class Query(graphene.ObjectType):
    applications = ApplicationsFilter(
        ApplicationType, filterset_class=ApplicationFilterSet
    )
    application_events = ApplicationEventsFilter(
        ApplicationEventType, filterset_class=ApplicationEventFilterSet
    )
    application_rounds = ApplicationRoundFilter(ApplicationRoundType)

    reservations = ReservationsFilter(
        ReservationType, filterset_class=ReservationFilterSet
    )
    reservation_by_pk = Field(ReservationType, pk=graphene.Int())

    reservation_cancel_reasons = ReservationCancelReasonFilter(
        ReservationCancelReasonType
    )

    reservation_deny_reasons = ReservationDenyReasonFilter(ReservationDenyReasonType)

    reservation_units = ReservationUnitsFilter(
        ReservationUnitType, filterset_class=ReservationUnitsFilterSet
    )
    reservation_unit = relay.Node.Field(ReservationUnitType)
    reservation_unit_by_pk = Field(ReservationUnitByPkType, pk=graphene.Int())
    reservation_unit_cancellation_rules = ReservationUnitCancellationRulesFilter(
        ReservationUnitCancellationRuleType
    )

    reservation_unit_types = ReservationUnitTypesFilter(
        ReservationUnitTypeType, filterset_class=ReservationUnitTypeFilterSet
    )

    resources = ResourcesFilter(ResourceType)
    resource = relay.Node.Field(ResourceType)
    resource_by_pk = Field(ResourceType, pk=graphene.Int())

    equipments = EquipmentFilter(EquipmentType, filterset_class=EquipmentFilterSet)
    equipment = relay.Node.Field((EquipmentType))
    equipment_by_pk = Field(EquipmentType, pk=graphene.Int())

    equipment_categories = EquipmentCategoryFilter(EquipmentCategoryType)
    equipment_category = relay.Node.Field((EquipmentCategoryType))
    equipment_category_by_pk = Field(EquipmentCategoryType, pk=graphene.Int())

    spaces = SpacesFilter(SpaceType)
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
    cities = CityFilter(CityType)
    metadata_sets = ReservationMetadataSetFilter(ReservationMetadataSetType)

    order = Field(PaymentOrderType, order_uuid=graphene.String())

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


class Mutation(graphene.ObjectType):
    create_application = ApplicationCreateMutation.Field()
    update_application = ApplicationUpdateMutation.Field()
    decline_application = ApplicationDeclineMutation.Field()
    flag_application = ApplicationFlagMutation.Field()

    create_application_event = ApplicationEventCreateMutation.Field()
    update_application_event = ApplicationEventUpdateMutation.Field()
    delete_application_event = ApplicationEventDeleteMutation.Field()
    decline_application_event = ApplicationEventDeclineMutation.Field()
    flag_application_event = ApplicationEventFlagMutation.Field()

    create_application_event_schedule_result = (
        ApplicationEventScheduleResultCreateMutation.Field()
    )
    update_application_event_schedule_result = (
        ApplicationEventScheduleResultUpdateMutation.Field()
    )

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
    require_handling_for_reservation = ReservationRequiresHandlingMutation.Field()
    update_reservation_working_memo = ReservationWorkingMemoMutation.Field()
    adjust_reservation_time = ReservationAdjustTimeMutation.Field()

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


schema = graphene.Schema(query=Query, mutation=Mutation)
