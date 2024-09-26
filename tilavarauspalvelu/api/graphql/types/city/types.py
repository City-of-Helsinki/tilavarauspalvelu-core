from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import City

from .permissions import CityPermission


class CityNode(DjangoNode):
    class Meta:
        model = City
        fields = [
            "pk",
            "name",
            "municipality_code",
        ]
        permission_classes = [CityPermission]
