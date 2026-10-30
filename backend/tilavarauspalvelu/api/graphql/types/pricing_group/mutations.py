from __future__ import annotations

from graphene_django_extensions import UpdateMutation

from .permissions import PricingGroupPermission
from .serializers import PricingGroupComponentsSerializer

__all__ = [
    "PricingGroupComponentsUpdateMutation",
]


class PricingGroupComponentsUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = PricingGroupComponentsSerializer
        permission_classes = [PricingGroupPermission]
