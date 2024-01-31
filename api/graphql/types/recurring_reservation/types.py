from django.db import models

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.recurring_reservation.filtersets import RecurringReservationFilterSet
from api.graphql.types.recurring_reservation.permissions import RecurringReservationPermission
from common.typing import AnyUser
from permissions.helpers import (
    can_view_recurring_reservation,
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservations.models import RecurringReservation


class RecurringReservationNode(DjangoAuthNode):
    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "name",
            "description",
            "begin_date",
            "begin_time",
            "end_date",
            "end_time",
            "recurrence_in_days",
            "weekdays",
            "reservation_unit",
            "user",
            "application_event_schedule",
            "age_group",
            "ability_group",
            "created",
        ]
        restricted_fields = {
            "user": can_view_recurring_reservation,
            "application_event_schedule": can_view_recurring_reservation,
        }
        filterset_class = RecurringReservationFilterSet
        permission_classes = (RecurringReservationPermission,)

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, user: AnyUser) -> models.QuerySet:
        if user.is_anonymous:
            return queryset.none()

        viewable_units = get_units_where_can_view_reservations(user)
        viewable_service_sectors = get_service_sectors_where_can_view_reservations(user)
        return queryset.filter(
            models.Q(reservation_unit__unit__in=viewable_units)
            | models.Q(reservation_unit__unit__service_sectors__in=viewable_service_sectors)
            | models.Q(user=user)
        ).distinct()
