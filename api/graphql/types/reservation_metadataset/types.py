import graphene
from graphene_permissions.mixins import AuthNode
from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from common.typing import GQLInfo
from reservations.models import ReservationMetadataSet


class ReservationMetadataSetType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (AllowAuthenticated,)

    supported_fields = graphene.List(graphene.String)
    required_fields = graphene.List(graphene.String)

    def resolve_supported_fields(root: ReservationMetadataSet, info: GQLInfo):
        return root.supported_fields.all()

    def resolve_required_fields(root: ReservationMetadataSet, info: GQLInfo):
        return root.required_fields.all()

    class Meta:
        model = ReservationMetadataSet
        fields = ["pk", "name", "supported_fields", "required_fields"]
        filter_fields = []
        interfaces = (graphene.relay.Node,)
