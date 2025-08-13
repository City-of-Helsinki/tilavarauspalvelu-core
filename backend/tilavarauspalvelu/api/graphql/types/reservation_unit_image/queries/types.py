from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.models import ReservationUnitImage, User

__all__ = [
    "ReservationUnitImageNode",
]


class ReservationUnitImageNode(QueryType[ReservationUnitImage], interfaces=[Node]):
    pk = Field()
    image_type = Field()

    @Field
    def image_url(root: ReservationUnitImage, info: GQLInfo[User]) -> str | None:
        # Annotating a ThumbnailerImageField annotates the name of the file (if it exists).
        image = root.image
        if not image:
            return None

        # Build the name into the absolute URL for the image.
        url = root.image.storage.url(image.name)
        return info.context.build_absolute_uri(url)

    @image_url.optimize
    def image_url_optimizer(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("image")

    @Field
    def large_url(root: ReservationUnitImage, info: GQLInfo[User]) -> str | None:
        if not root.large_url:
            return None
        return info.context.build_absolute_uri(root.large_url)

    @Field
    def small_url(root: ReservationUnitImage, info: GQLInfo[User]) -> str | None:
        if not root.small_url:
            return None
        return info.context.build_absolute_uri(root.small_url)

    @Field
    def medium_url(root: ReservationUnitImage, info: GQLInfo[User]) -> str | None:
        if not root.medium_url:
            return None
        return info.context.build_absolute_uri(root.medium_url)
