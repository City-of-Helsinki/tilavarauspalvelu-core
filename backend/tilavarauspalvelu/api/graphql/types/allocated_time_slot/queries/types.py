from __future__ import annotations

from typing import TYPE_CHECKING

from lookup_property import L
from undine import Field, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import AllocatedTimeSlot

from .filtersets import AllocatedTimeSlotFilterSet
from .ordersets import AllocatedTimeSlotOrderSet

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "AllocatedTimeSlotNode",
]


class AllocatedTimeSlotNode(
    QueryType[AllocatedTimeSlot],
    filterset=AllocatedTimeSlotFilterSet,
    orderset=AllocatedTimeSlotOrderSet,
    auto=False,
    interfaces=[Node],
):
    pk = Field()
    day_of_the_week = Field()
    begin_time = Field()
    end_time = Field()
    reservation_unit_option = Field()
    reservation_series = Field()

    @classmethod
    def __permissions__(cls, instance: AllocatedTimeSlot, info: GQLInfo) -> None:
        user = info.context.user
        application = instance.reservation_unit_option.application_section.application
        if application.user == user and application.status == ApplicationStatusChoice.RESULTS_SENT:
            return

        if not user.permissions.has_any_role():
            msg = "No permission to access node."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __filter_queryset__(
        cls,
        queryset: models.QuerySet[AllocatedTimeSlot],
        info: GQLInfo,
    ) -> models.QuerySet[AllocatedTimeSlot]:
        user = info.context.user

        if user.permissions.has_any_role():
            return queryset

        return queryset.alias(
            application_status=L("reservation_unit_option__application_section__application__status"),
        ).filter(
            reservation_unit_option__application_section__application__user=user,
            application_status=ApplicationStatusChoice.RESULTS_SENT,
        )
