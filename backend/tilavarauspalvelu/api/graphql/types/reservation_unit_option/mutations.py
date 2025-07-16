from __future__ import annotations

from .permissions import ReservationUnitOptionPermission
from .serializers import ReservationUnitOptionHandlerSerializer

__all__ = [
    "ReservationUnitOptionUpdateMutation",
]


class ReservationUnitOptionUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitOptionHandlerSerializer
        permission_classes = [ReservationUnitOptionPermission]
