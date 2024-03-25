from graphene_django_extensions import DjangoNode

from api.graphql.types.ability_group.permissions import AbilityGroupPermission
from reservations.models import AbilityGroup


class AbilityGroupNode(DjangoNode):
    class Meta:
        model = AbilityGroup
        fields = [
            "pk",
            "name",
        ]
        permission_classes = [AbilityGroupPermission]
