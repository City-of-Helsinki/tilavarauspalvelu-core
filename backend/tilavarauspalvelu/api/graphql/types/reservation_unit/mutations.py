from __future__ import annotations

from graphene_django_extensions import CreateMutation, UpdateMutation

from tilavarauspalvelu.models import ReservationUnit
from tilavarauspalvelu.typing import AnyUser

from .permissions import ReservationUnitPermission
from .serializers import ReservationUnitArchiveSerializer, ReservationUnitSerializer


class ReservationUnitCreateMutation(CreateMutation[ReservationUnit, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]


class ReservationUnitUpdateMutation(UpdateMutation[ReservationUnit, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitSerializer
        permission_classes = [ReservationUnitPermission]


class ReservationUnitArchiveMutation(UpdateMutation[ReservationUnit, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitArchiveSerializer
        permission_classes = [ReservationUnitPermission]
