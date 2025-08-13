from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.models import Purpose, User

from .filtersets import PurposeFilterSet
from .ordersets import PurposeOrderSet

__all__ = [
    "PurposeNode",
]


class PurposeNode(
    QueryType[Purpose],
    filterset=PurposeFilterSet,
    orderset=PurposeOrderSet,
    interfaces=[Node],
):
    pk = Field()
    rank = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    @Field
    def image_url(root: Purpose, info: GQLInfo[User]) -> str | None:
        if not root.image:
            return None
        return info.context.build_absolute_uri(root.image.url)

    @image_url.optimize
    def optimize_image_url(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("image")

    @Field
    def small_url(root: Purpose, info: GQLInfo[User]) -> str | None:
        if not root.image:
            return None
        small_image = root.image["purpose_image"]
        return info.context.build_absolute_uri(small_image.url)

    @small_url.optimize
    def optimize_small_url(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("image")
