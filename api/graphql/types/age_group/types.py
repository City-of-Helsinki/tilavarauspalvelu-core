from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.age_group.filtersets import AgeGroupFilterSet
from api.graphql.types.age_group.permissions import AgeGroupPermission
from reservations.models import AgeGroup


class AgeGroupNode(DjangoAuthNode):
    class Meta:
        model = AgeGroup
        fields = [
            "pk",
            "minimum",
            "maximum",
        ]
        filterset_class = AgeGroupFilterSet
        permission_classes = (AgeGroupPermission,)
