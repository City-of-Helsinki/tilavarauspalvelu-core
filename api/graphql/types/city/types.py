from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.city.permissions import CityPermission
from applications.models import City


class CityNode(DjangoAuthNode):
    class Meta:
        model = City
        fields = [
            "pk",
            "name",
            "municipality_code",
        ]
        permission_classes = (CityPermission,)
