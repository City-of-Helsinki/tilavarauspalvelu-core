from __future__ import annotations

from graphene_django_extensions import UpdateMutation

from tilavarauspalvelu.models import ReservationUnitOption
from tilavarauspalvelu.typing import AnyUser

from .permissions import ReservationUnitOptionPermission
from .serializers import ReservationUnitOptionHandlerSerializer

__all__ = [
    "ReservationUnitOptionUpdateMutation",
]


class ReservationUnitOptionUpdateMutation(UpdateMutation[ReservationUnitOption, AnyUser]):
    class Meta:
        serializer_class = ReservationUnitOptionHandlerSerializer
        permission_classes = [ReservationUnitOptionPermission]
