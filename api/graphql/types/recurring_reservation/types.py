import graphene
from django.db import models
from graphene_django_extensions import DjangoNode

from api.graphql.types.recurring_reservation.filtersets import RecurringReservationFilterSet
from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from common.typing import GQLInfo
from permissions.helpers import (
    can_view_recurring_reservation,
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
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

        viewable_units = get_units_where_can_view_reservations(user)
        viewable_service_sectors = get_service_sectors_where_can_view_reservations(user)

        return queryset.filter(
            models.Q(reservation_unit__unit__in=viewable_units)
            | models.Q(reservation_unit__unit__service_sectors__in=viewable_service_sectors)
            | models.Q(user=user)
        ).distinct()

    def resolve_weekdays(root: RecurringReservation, info: GQLInfo) -> list[int]:
        if root.weekdays:
            return [int(i) for i in root.weekdays.split(",")]
        return []
