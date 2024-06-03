import graphene
from django.db import models
from easy_thumbnails.files import get_thumbnailer
from graphene_django_extensions import DjangoNode
from query_optimizer import AnnotatedField

from api.graphql.types.purpose.filtersets import PurposeFilterSet
from api.graphql.types.purpose.permissions import PurposePermission
from common.typing import GQLInfo
from reservation_units.models import Purpose

__all__ = [
    "PurposeNode",
]


class PurposeNode(DjangoNode):
    image_url = AnnotatedField(graphene.String, expression=models.F("image"))
    small_url = AnnotatedField(graphene.String, expression=models.F("image"))

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
        # Annotating a ThumbnailerImageField annotates the name of the file (if it exists).
        image_name: str | None = getattr(root, "image_url", None)
        if not image_name:
            return None

        # Build the name into the absolute URL for the image.
        url = root.image.storage.url(image_name)
        return info.context.build_absolute_uri(url)

    def resolve_small_url(root: Purpose, info: GQLInfo) -> str | None:
        image_name: str | None = getattr(root, "image_url", None)
        if not image_name:
            return None

        url = get_thumbnailer(image_name)["purpose_image"].url
        return info.context.build_absolute_uri(url)
