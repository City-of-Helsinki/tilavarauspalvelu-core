from django.db import models
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitOption
from tilavarauspalvelu.typing import GQLInfo

from .filtersets import ReservationUnitOptionFilterSet
from .permissions import ReservationUnitOptionPermission


class ReservationUnitOptionNode(DjangoNode):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
            "locked",
            "rejected",
            "reservation_unit",
            "application_section",
            "allocated_time_slots",
        ]
        filterset_class = ReservationUnitOptionFilterSet
        permission_classes = [ReservationUnitOptionPermission]
        restricted_fields = {
            "locked": lambda user: user.permissions.has_any_role(),
            "rejected": lambda user: user.permissions.has_any_role(),
        }

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.permissions.has_any_role():
            return queryset

        return queryset.filter(application_section__application__user=user)
