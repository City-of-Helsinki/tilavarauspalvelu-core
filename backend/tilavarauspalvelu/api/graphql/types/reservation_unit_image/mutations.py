from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models import ReservationUnitImage

from .permissions import ReservationUnitImagePermission
from .serializers import ReservationUnitImageCreateSerializer, ReservationUnitImageUpdateSerializer

__all__ = [
    "ReservationUnitImageCreateMutation",
    "ReservationUnitImageDeleteMutation",
    "ReservationUnitImageUpdateMutation",
]


class ReservationUnitImageCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationUnitImageCreateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitImageUpdateSerializer
        permission_classes = [ReservationUnitImagePermission]


class ReservationUnitImageDeleteMutation(DeleteMutation):
    class Meta:
        model = ReservationUnitImage
        permission_classes = [ReservationUnitImagePermission]
