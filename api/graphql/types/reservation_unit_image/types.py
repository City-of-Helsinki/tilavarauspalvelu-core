import graphene
from graphene_django_extensions import DjangoNode

from common.typing import GQLInfo
from reservation_units.models import ReservationUnitImage


class ReservationUnitImageNode(DjangoNode):
    image_url = graphene.String()
    medium_url = graphene.String()
    small_url = graphene.String()
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

    def resolve_image_url(root: ReservationUnitImage, info: GQLInfo) -> str | None:
        if not root.image:
            return None
        return info.context.build_absolute_uri(root.image.url)

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
