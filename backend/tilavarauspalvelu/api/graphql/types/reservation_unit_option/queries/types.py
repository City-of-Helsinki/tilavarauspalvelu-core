from django.db import models
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.models import ReservationUnitOption, User
from tilavarauspalvelu.models.reservation_unit_option.queryset import ReservationUnitOptionQuerySet

from .filtersets import ReservationUnitOptionFilterSet
from .orderset import ReservationUnitOptionOrderSet

__all__ = [
    "ReservationUnitOptionNode",
]


class ReservationUnitOptionNode(
    QueryType[ReservationUnitOption],
    filterset=ReservationUnitOptionFilterSet,
    orderset=ReservationUnitOptionOrderSet,
    interfaces=[Node],
):
    pk = Field()
    preferred_order = Field()
    is_locked = Field()
    is_rejected = Field()
    reservation_unit = Field()
    application_section = Field()
    allocated_time_slots = Field()

    @is_locked.permissions
    @is_rejected.permissions
    def has_handling_permissions(root: ReservationUnitOption, info: GQLInfo[User], value: bool) -> None:  # noqa: FBT001,ARG002
        user = info.context.user
        if not user.permissions.has_any_role():
            msg = "No permission to access this field"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __permissions__(cls, instance: ReservationUnitOption, info: GQLInfo[User]) -> None:
        user = info.context.user
        application = instance.application_section.application
        if application.user == user:
            return

        if not user.permissions.has_any_role():
            msg = "No permission to access this field"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo) -> None:
        application_section_data = data.add_select_related("application_section")
        application_data = application_section_data.add_select_related("application")
        application_data.add_select_related("user")

    @classmethod
    def __filter_queryset__(cls, queryset: ReservationUnitOptionQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            return queryset.none()

        if user.permissions.has_any_role():
            return queryset

        return queryset.filter(application_section__application__user=user)
