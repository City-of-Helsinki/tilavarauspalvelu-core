import graphene
from easy_thumbnails.files import get_thumbnailer
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.purpose.permissions import PurposePermission
from common.typing import GQLInfo
from reservation_units.models import Purpose


class PurposeType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (PurposePermission,)

    image_url = graphene.String()
    small_url = graphene.String()

    class Meta:
        model = Purpose
        fields = ["pk", "image_url", "small_url", "rank", *get_all_translatable_fields(model)]
        filter_fields = ["name_fi", "name_en", "name_sv"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_image_url(root: Purpose, info: GQLInfo):
        if not root.image:
            return None
        return info.context.build_absolute_uri(root.image.url)

    def resolve_small_url(root: Purpose, info: GQLInfo):
        if not root.image:
            return None
        url = get_thumbnailer(root.image)["purpose_image"].url
        return info.context.build_absolute_uri(url)
