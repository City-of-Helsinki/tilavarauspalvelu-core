from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import AbilityGroup

from .permissions import AbilityGroupPermission


class AbilityGroupNode(DjangoNode):
    class Meta:
        model = AbilityGroup
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [AbilityGroupPermission]
