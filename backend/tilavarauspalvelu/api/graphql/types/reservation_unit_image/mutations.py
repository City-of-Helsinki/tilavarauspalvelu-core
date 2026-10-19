from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models import ReservationUnitImage
from tilavarauspalvelu.typing import AnyUser

from .permissions import ReservationUnitImagePermission
from .serializers import ReservationUnitImageCreateSerializer, ReservationUnitImageUpdateSerializer

__all__ = [
    "ReservationUnitImageCreateMutation",
    "ReservationUnitImageDeleteMutation",
    "ReservationUnitImageUpdateMutation",
]


class ReservationUnitImageCreateMutation(CreateMutation[ReservationUnitImage, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitImageCreateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageUpdateMutation(UpdateMutation[ReservationUnitImage, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitImageUpdateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageDeleteMutation(DeleteMutation[ReservationUnitImage, AnyUser]):
    class Meta:
        model = ReservationUnitImage
        permission_classes = [ReservationUnitImagePermission]
