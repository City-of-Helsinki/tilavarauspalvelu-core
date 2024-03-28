import graphene
from easy_thumbnails.files import get_thumbnailer
from graphene_django_extensions import DjangoNode

from api.graphql.types.purpose.filtersets import PurposeFilterSet
from api.graphql.types.purpose.permissions import PurposePermission
from common.typing import GQLInfo
from reservation_units.models import Purpose

__all__ = [
    "PurposeNode",
]


class PurposeNode(DjangoNode):
    image_url = graphene.String()
    small_url = graphene.String()

    class Meta:
        model = Purpose
        fields = [
            "pk",
            "rank",
            "name",
            "image_url",
            "small_url",
        ]
        filterset_class = PurposeFilterSet
        permission_classes = [PurposePermission]

    def resolve_image_url(root: Purpose, info: GQLInfo) -> str | None:
        if not root.image:
            return None
        return info.context.build_absolute_uri(root.image.url)

    def resolve_small_url(root: Purpose, info: GQLInfo) -> str | None:
        if not root.image:
            return None
        url = get_thumbnailer(root.image)["purpose_image"].url
        return info.context.build_absolute_uri(url)
