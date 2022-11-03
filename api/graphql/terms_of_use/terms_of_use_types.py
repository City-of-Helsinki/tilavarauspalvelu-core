import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from api.graphql.translate_fields import get_all_translatable_fields
from permissions.api_permissions.graphene_permissions import TermsOfUsePermission
from terms_of_use.models import TermsOfUse


class TermsOfUseType(AuthNode, PrimaryKeyObjectType):
    pk = graphene.String()

    permission_classes = (TermsOfUsePermission,)

    class Meta:
        model = TermsOfUse
        fields = ["pk", "terms_type"] + get_all_translatable_fields(model)
        filter_fields = ["terms_type"]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection
