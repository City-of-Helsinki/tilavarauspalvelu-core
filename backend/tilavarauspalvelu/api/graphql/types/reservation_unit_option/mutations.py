from graphene_django_extensions import UpdateMutation

from .permissions import ReservationUnitOptionPermission
from .serializers import ReservationUnitOptionHandlerSerializer

__all__ = [
    "ReservationUnitOptionUpdateMutation",
]


class ReservationUnitOptionUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUnitOptionHandlerSerializer
        permission_classes = [ReservationUnitOptionPermission]
