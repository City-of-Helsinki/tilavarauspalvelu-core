from __future__ import annotations

from graphene_django_extensions import UpdateMutation

from tilavarauspalvelu.models import Unit
from tilavarauspalvelu.typing import AnyUser

from .permissions import UnitPermission
from .serializers import UnitUpdateSerializer

__all__ = [
    "UnitUpdateMutation",
]


class UnitUpdateMutation(UpdateMutation[Unit, AnyUser]):
    class Meta:
        serializer_class = UnitUpdateSerializer
        permission_classes = [UnitPermission]
