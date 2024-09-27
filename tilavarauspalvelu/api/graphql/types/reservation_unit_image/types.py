import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from query_optimizer import AnnotatedField

from tilavarauspalvelu.models import ReservationUnitImage
from tilavarauspalvelu.typing import GQLInfo

from .permissions import ReservationUnitImagePermission


class ReservationUnitImageNode(DjangoNode):
    image_url = AnnotatedField(graphene.String, expression=models.F("image"))

    small_url = graphene.String()
    medium_url = graphene.String()
    large_url = graphene.String()

    class Meta:
        model = ReservationUnitImage
        fields = [
            "pk",
            "image_url",
            "large_url",
            "medium_url",
            "small_url",
            "image_type",
        ]
        permission_classes = [ReservationUnitImagePermission]

    def resolve_image_url(root: ReservationUnitImage, info: GQLInfo) -> str | None:
        # Annotating a ThumbnailerImageField annotates the name of the file (if it exists).
        image_name: str | None = getattr(root, "image_url", None)
        if not image_name:
            return None

        # Build the name into the absolute URL for the image.
        url = root.image.storage.url(image_name)
        return info.context.build_absolute_uri(url)

    def resolve_large_url(root: ReservationUnitImage, info: GQLInfo) -> str | None:
        if not root.large_url:
            return None
        return info.context.build_absolute_uri(root.large_url)

    def resolve_small_url(root: ReservationUnitImage, info: GQLInfo) -> str | None:
        if not root.small_url:
            return None
        return info.context.build_absolute_uri(root.small_url)

    def resolve_medium_url(root: ReservationUnitImage, info: GQLInfo) -> str | None:
        if not root.medium_url:
            return None
        return info.context.build_absolute_uri(root.medium_url)
