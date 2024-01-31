from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.ability_group.filtersets import AbilityGroupFilterSet
from api.graphql.types.ability_group.permissions import AbilityGroupPermission
from reservations.models import AbilityGroup


class AbilityGroupNode(DjangoAuthNode):
    class Meta:
        model = AbilityGroup
        fields = [
            "pk",
            "name",
        ]
        filterset_class = AbilityGroupFilterSet
        permission_classes = (AbilityGroupPermission,)
