from graphene_django_extensions import UpdateMutation

from .permissions import ApplicationRoundPermission
from .serializers import SetApplicationRoundHandledSerializer, SetApplicationRoundResultsSentSerializer

__all__ = [
    "SetApplicationRoundHandledMutation",
]


class SetApplicationRoundHandledMutation(UpdateMutation):
    class Meta:
        serializer_class = SetApplicationRoundHandledSerializer
        permission_classes = [ApplicationRoundPermission]


class SetApplicationRoundResultsSentMutation(UpdateMutation):
    class Meta:
        serializer_class = SetApplicationRoundResultsSentSerializer
        permission_classes = [ApplicationRoundPermission]
