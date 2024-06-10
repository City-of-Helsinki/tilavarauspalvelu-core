from graphene_django_extensions import DjangoNode

from applications.models import City
from tilavarauspalvelu.api.graphql.types.city.permissions import CityPermission


class CityNode(DjangoNode):
    class Meta:
        model = City
        fields = [
            "pk",
            "name",
            "municipality_code",
        ]
        permission_classes = [CityPermission]
