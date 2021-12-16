import graphene
from django.conf import settings
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAny

from api.graphql.base_type import PrimaryKeyObjectType
from applications.models import City
from permissions.api_permissions.graphene_permissions import CityPermission


class CityType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (
        (CityPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model = City
        fields = ["name"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
