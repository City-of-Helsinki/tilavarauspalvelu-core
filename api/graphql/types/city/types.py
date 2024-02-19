from graphene_django_extensions import DjangoNode

from api.graphql.types.city.permissions import CityPermission
from applications.models import City


class CityNode(DjangoNode):
    class Meta:
        model = City
        fields = [
            "pk",
            "name",
            "municipality_code",
        ]
        permission_classes = [CityPermission]
