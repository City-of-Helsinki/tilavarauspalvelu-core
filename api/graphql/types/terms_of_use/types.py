import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.terms_of_use.permissions import TermsOfUsePermission
from terms_of_use.models import TermsOfUse


class TermsOfUseType(AuthNode, OldPrimaryKeyObjectType):
    pk = graphene.String()

    permission_classes = (TermsOfUsePermission,)

    class Meta:
        model = TermsOfUse
        fields = ["pk", "terms_type"] + get_all_translatable_fields(model)
        filter_fields = ["terms_type"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection
