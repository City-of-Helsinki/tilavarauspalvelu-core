import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_type import PrimaryKeyObjectType
from permissions.api_permissions.graphene_permissions import UnitPermission
from spaces.models import Unit


class UnitType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (UnitPermission,)

    class Meta:
        model = Unit
        fields = (
            "id",
            "tprek_id",
            "name",
            "description",
            "short_description",
            "web_page",
            "email",
            "phone",
        )

        filter_fields = {
            "name": ["exact", "icontains", "istartswith"],
        }

        interfaces = (graphene.relay.Node,)
