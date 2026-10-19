from __future__ import annotations

from graphene_django_extensions import UpdateMutation

from tilavarauspalvelu.models import PricingGroup
from tilavarauspalvelu.typing import AnyUser

from .permissions import PricingGroupPermission
from .serializers import PricingGroupComponentsSerializer

__all__ = [
    "PricingGroupComponentsUpdateMutation",
]


class PricingGroupComponentsUpdateMutation(UpdateMutation[PricingGroup, AnyUser]):
    class Meta:
        serializer_class = PricingGroupComponentsSerializer
        permission_classes = [PricingGroupPermission]
