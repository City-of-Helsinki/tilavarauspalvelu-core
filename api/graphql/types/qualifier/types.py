import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.qualifier.permissions import QualifierPermission
from reservation_units.models import Qualifier


class QualifierType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (QualifierPermission,)

    class Meta:
        model = Qualifier
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
