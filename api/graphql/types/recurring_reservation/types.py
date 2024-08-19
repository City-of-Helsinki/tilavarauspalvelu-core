import graphene
from django.db import models
from graphene_django_extensions import DjangoNode

from api.graphql.types.recurring_reservation.filtersets import RecurringReservationFilterSet
from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from common.typing import GQLInfo
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
            "rejected_occurrences",
            "allocated_time_slot",
        ]
        restricted_fields = {
            "name": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "description": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "user": lambda user, res: user.permissions.can_view_recurring_reservation(res),
            "allocated_time_slot": lambda user, res: user.permissions.can_view_recurring_reservation(res),
        }
        filterset_class = RecurringReservationFilterSet
        permission_classes = [RecurringReservationPermission]

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous:
            return queryset.none()
        if not user.permissions.has_any_role():
            return queryset.filter(user=user)
        return queryset

    def resolve_weekdays(root: RecurringReservation, info: GQLInfo) -> list[int]:
        if root.weekdays:
            return [int(i) for i in root.weekdays.split(",")]
        return []
