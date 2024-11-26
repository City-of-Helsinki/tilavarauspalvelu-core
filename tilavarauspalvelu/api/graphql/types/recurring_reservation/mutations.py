from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import CreateMutation, UpdateMutation

from tilavarauspalvelu.enums import ReservationStateChoice
from utils.date_utils import local_datetime

from .permissions import RecurringReservationPermission
from .serializers import (
    ReservationSeriesCreateSerializer,
    ReservationSeriesDenyInputSerializer,
    ReservationSeriesDenyOutputSerializer,
    ReservationSeriesRescheduleSerializer,
    ReservationSeriesUpdateSerializer,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import RecurringReservation

__all__ = [
    "ReservationSeriesCreateMutation",
    "ReservationSeriesRescheduleMutation",
    "ReservationSeriesUpdateMutation",
]


class ReservationSeriesCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationSeriesCreateSerializer
        permission_classes = [RecurringReservationPermission]


class ReservationSeriesUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationSeriesUpdateSerializer
        permission_classes = [RecurringReservationPermission]


class ReservationSeriesRescheduleMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationSeriesRescheduleSerializer
        permission_classes = [RecurringReservationPermission]


class ReservationSeriesDenyMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationSeriesDenyInputSerializer
        output_serializer_class = ReservationSeriesDenyOutputSerializer
        permission_classes = [RecurringReservationPermission]

    @classmethod
    def get_serializer_output(cls, instance: RecurringReservation) -> dict[str, Any]:
        future_reservations = instance.reservations.filter(begin__gt=local_datetime())
        return {
            "denied": future_reservations.filter(state=ReservationStateChoice.DENIED).count(),
            "future": future_reservations.count(),
        }
