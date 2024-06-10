from graphene_django_extensions import DjangoNode

from reservations.models import AbilityGroup
from tilavarauspalvelu.api.graphql.types.ability_group.permissions import AbilityGroupPermission


class AbilityGroupNode(DjangoNode):
    class Meta:
        model = AbilityGroup
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [AbilityGroupPermission]
