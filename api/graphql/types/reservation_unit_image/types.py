import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from api.graphql.types.reservation_unit_cancellation_rule.permissions import ReservationUnitCancellationRulePermission
from common.typing import GQLInfo
from reservation_units.models import ReservationUnitCancellationRule, ReservationUnitImage


class ReservationUnitImageType(OldPrimaryKeyObjectType):
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
        connection_class = TVPBaseConnection

    def resolve_image_url(self, info):
        if not self.image:
            return None

        return info.context.build_absolute_uri(self.image.url)

    def resolve_large_url(self, info):
        if not self.large_url:
            return None

        return info.context.build_absolute_uri(self.large_url)

    def resolve_small_url(self, info):
        if not self.small_url:
            return None

        return info.context.build_absolute_uri(self.small_url)

    def resolve_medium_url(self, info):
        if not self.medium_url:
            return None

        return info.context.build_absolute_uri(self.medium_url)


class ReservationUnitCancellationRuleType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (ReservationUnitCancellationRulePermission,)

    class Meta:
        model = ReservationUnitCancellationRule
        fields = [
            "pk",
            "can_be_cancelled_time_before",
            "needs_handling",
        ] + get_all_translatable_fields(model)
        filter_fields = ["name"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_can_be_cancelled_time_before(self, info: GQLInfo):
        if not self.can_be_cancelled_time_before:
            return None
        return self.can_be_cancelled_time_before.total_seconds()
