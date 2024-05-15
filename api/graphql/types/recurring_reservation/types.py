import graphene
from django.db import models
from graphene_django_extensions import DjangoNode

from api.graphql.types.recurring_reservation.filtersets import RecurringReservationFilterSet
from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from common.typing import GQLInfo
from permissions.helpers import can_view_recurring_reservation, has_general_permission
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices
from reservations.models import RecurringReservation

__all__ = [
    "RecurringReservationNode",
]


class RecurringReservationNode(DjangoNode):
    weekdays = graphene.List(graphene.Int)

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "user",
            "age_group",
            "ability_group",
            "name",
            "description",
            "reservation_unit",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
            "recurrence_in_days",
            "weekdays",
            "created",
            "reservations",
        ]
        restricted_fields = {
            "user": lambda user, instance: can_view_recurring_reservation(user, instance),
        }
        filterset_class = RecurringReservationFilterSet
        permission_classes = [RecurringReservationPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous:
            return queryset.none()
        if user.is_superuser:
            return queryset
        if has_general_permission(user, GeneralPermissionChoices.CAN_VIEW_RESERVATIONS):
            return queryset

        unit_permission = UnitPermissionChoices.CAN_VIEW_RESERVATIONS.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return queryset.filter(
            models.Q(user=user)
            | models.Q(reservation_unit__unit__in=unit_ids)
            | models.Q(reservation_unit__unit__unit_groups__in=unit_group_ids)
        ).distinct()

    def resolve_weekdays(root: RecurringReservation, info: GQLInfo) -> list[int]:
        if root.weekdays:
            return [int(i) for i in root.weekdays.split(",")]
        return []
