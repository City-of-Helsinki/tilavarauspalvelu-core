from graphene_django_extensions import UpdateMutation

from .permissions import UnitPermission
from .serializers import UnitUpdateSerializer

__all__ = [
    "UnitUpdateMutation",
]


class UnitUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UnitUpdateSerializer
        permission_classes = [UnitPermission]
