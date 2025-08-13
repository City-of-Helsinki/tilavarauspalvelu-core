from django.db import models
from django.db.models import Q
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import Application, User
from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

from .filtersets import ApplicationFilterSet
from .ordersets import ApplicationOrderSet

__all__ = [
    "ApplicationNode",
]


class ApplicationNode(
    QueryType[Application],
    filterset=ApplicationFilterSet,
    orderset=ApplicationOrderSet,
    interfaces=[Node],
):
    pk = Field()

    additional_information = Field()
    working_memo = Field()

    applicant_type = Field()
    municipality = Field()

    billing_street_address = Field()
    billing_post_code = Field()
    billing_city = Field()

    organisation_name = Field()
    organisation_email = Field()
    organisation_identifier = Field()
    organisation_year_established = Field()
    organisation_active_members = Field()
    organisation_core_business = Field()
    organisation_street_address = Field()
    organisation_post_code = Field()
    organisation_city = Field()

    contact_person_first_name = Field()
    contact_person_last_name = Field()
    contact_person_email = Field()
    contact_person_phone_number = Field()

    cancelled_at = Field()
    sent_at = Field()
    created_at = Field()
    updated_at = Field()

    status = Field(L("status"))

    application_round = Field()
    application_sections = Field()
    user = Field()

    @user.permissions
    def user_permissions(root: Application, info: GQLInfo[User], value: str) -> None:
        """
        No need to check permissions, since permissions for the
        `ApplicationNode` are enough to access the its user.
        """

    @working_memo.permissions
    def working_memo_permissions(root: Application, info: GQLInfo[User], value: str) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_view_application(root, reserver_needs_role=True):
            msg = "No permission to access working memo."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __permissions__(cls, instance: Application, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.permissions.can_view_application(instance):
            msg = "No permission to access node."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo) -> None:
        # See 'tilavarauspalvelu.models.application.queryset.ApplicationQuerySet.with_permissions'
        data.aliases["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = models.Value("")

        data.add_select_related("user")

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationQuerySet, info: GQLInfo[User]) -> ReservationQuerySet:
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            return queryset.none()

        if user.is_superuser:
            return queryset

        roles = UserRoleChoice.can_view_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return queryset

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return queryset.filter(
            Q(user=user)
            | Q(application_sections__reservation_unit_options__reservation_unit__unit__in=u_ids)
            | Q(application_sections__reservation_unit_options__reservation_unit__unit__unit_groups__in=g_ids)
        ).distinct()
