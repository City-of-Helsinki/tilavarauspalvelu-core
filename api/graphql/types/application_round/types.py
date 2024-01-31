import graphene
from graphene_django import DjangoListField

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.application_round.filtersets import ApplicationRoundFilterSet
from api.graphql.types.application_round.permissions import ApplicationRoundPermission
from api.graphql.types.reservation_purpose.types import ReservationPurposeNode
from api.graphql.types.reservation_units.types import ReservationUnitType
from applications.choices import ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.typing import GQLInfo


class ApplicationRoundNode(DjangoAuthNode):
    purposes = ReservationPurposeNode.ListField()
    reservation_units = DjangoListField(ReservationUnitType)

    status = graphene.Field(graphene.Enum.from_enum(ApplicationRoundStatusChoice))
    status_timestamp = graphene.DateTime()

    applications_count = graphene.Int()
    reservation_unit_count = graphene.Int()

    class Meta:
        model = ApplicationRound
        fields = [
            "pk",
            "name",
            "target_group",
            "criteria",
            "application_period_begin",
            "application_period_end",
            "reservation_period_begin",
            "reservation_period_end",
            "public_display_begin",
            "public_display_end",
            "handled_date",
            "sent_date",
            "reservation_units",
            "purposes",
            "service_sector",
            "status",
            "status_timestamp",
            "applications_count",
            "reservation_unit_count",
        ]
        filterset_class = ApplicationRoundFilterSet
        permission_classes = (ApplicationRoundPermission,)

    def resolve_applications_count(root: ApplicationRound, info: GQLInfo) -> int:
        return root.applications.all().reached_allocation().count()

    def resolve_reservation_unit_count(root: ApplicationRound, info: GQLInfo) -> int:
        return root.reservation_units.all().count()
