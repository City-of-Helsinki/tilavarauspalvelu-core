from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from .permissions import ReservationUnitPermission
from .serializers import ReservationUnitSerializer


class ReservationUnitCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]


class ReservationUnitUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]
