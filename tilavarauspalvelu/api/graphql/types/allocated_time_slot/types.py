from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L

from tilavarauspalvelu.enums import ApplicationStatusChoice
from tilavarauspalvelu.models import AllocatedTimeSlot
from tilavarauspalvelu.typing import GQLInfo

from .filtersets import AllocatedTimeSlotFilterSet
from .permissions import AllocatedTimeSlotPermission

__all__ = [
    "AllocatedTimeSlotNode",
]


class AllocatedTimeSlotNode(DjangoNode):
    class Meta:
        model = AllocatedTimeSlot
        fields = [
            "pk",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "reservation_unit_option",
            "recurring_reservation",
        ]
        filterset_class = AllocatedTimeSlotFilterSet
        permission_classes = [AllocatedTimeSlotPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.permissions.has_any_role():
            return queryset

        return queryset.alias(
            application_status=L("reservation_unit_option__application_section__application__status"),
        ).filter(
            reservation_unit_option__application_section__application__user=user,
            application_status=ApplicationStatusChoice.RESULTS_SENT,
        )
