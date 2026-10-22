from __future__ import annotations

from graphene_django_extensions import UpdateMutation

from tilavarauspalvelu.models import ApplicationRound
from tilavarauspalvelu.typing import AnyUser

from .permissions import ApplicationRoundPermission
from .serializers import SetApplicationRoundHandledSerializer, SetApplicationRoundResultsSentSerializer

__all__ = [
    "SetApplicationRoundHandledMutation",
]


class SetApplicationRoundHandledMutation(UpdateMutation[ApplicationRound, AnyUser]):
    class Meta:
        serializer_class = SetApplicationRoundHandledSerializer
        permission_classes = [ApplicationRoundPermission]


class SetApplicationRoundResultsSentMutation(UpdateMutation[ApplicationRound, AnyUser]):
    class Meta:
        serializer_class = SetApplicationRoundResultsSentSerializer
        permission_classes = [ApplicationRoundPermission]
