from django.db import models
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import AllocatedTimeSlot, User
from tilavarauspalvelu.models.allocated_timeslot.queryset import AllocatedTimeSlotQuerySet

from .filtersets import AllocatedTimeSlotFilterSet
from .ordersets import AllocatedTimeSlotOrderSet

__all__ = [
    "AllocatedTimeSlotNode",
]


class AllocatedTimeSlotNode(
    QueryType[AllocatedTimeSlot],
    filterset=AllocatedTimeSlotFilterSet,
    orderset=AllocatedTimeSlotOrderSet,
    interfaces=[Node],
):
    pk = Field()
    day_of_the_week = Field()
    begin_time = Field()
    end_time = Field()
    reservation_unit_option = Field()
    reservation_series = Field()

    @classmethod
    def __permissions__(cls, instance: AllocatedTimeSlot, info: GQLInfo[User]) -> None:
        user = info.context.user
        if user.permissions.has_any_role():
            return

        application = instance.reservation_unit_option.application_section.application
        if application.user == user and application.status == ApplicationStatusChoice.RESULTS_SENT:
            return

        msg = "No permission to access allocated time slot."
        raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo[User]) -> None:
        # Add optimizations for resolving permissions
        option_data = data.add_select_related("reservation_unit_option")
        section_data = option_data.add_select_related("application_section")
        application_data = section_data.add_select_related("application")
        application_data.annotations["status"] = L("status")
        application_data.add_select_related("user")

    @classmethod
    def __filter_queryset__(cls, queryset: AllocatedTimeSlotQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        user = info.context.user
        if user.is_anonymous or not user.is_active:
            return queryset.none()

        if user.permissions.has_any_role():
            return queryset

        return queryset.filter(
            models.Q(reservation_unit_option__application_section__application__user=user)
            & L(reservation_unit_option__application_section__application__status=ApplicationStatusChoice.RESULTS_SENT)
        )
