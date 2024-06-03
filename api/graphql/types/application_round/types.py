import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from api.graphql.types.application_round.filtersets import ApplicationRoundFilterSet
from api.graphql.types.application_round.permissions import ApplicationRoundPermission
from applications.choices import ApplicationRoundReservationCreationStatusChoice, ApplicationRoundStatusChoice
from applications.models import ApplicationRound
from common.typing import GQLInfo


class ApplicationRoundNode(DjangoNode):
    status = AnnotatedField(
        graphene.Enum.from_enum(ApplicationRoundStatusChoice),
        expression=L("status"),
    )
    status_timestamp = AnnotatedField(
        graphene.DateTime,
        expression=L("status_timestamp"),
    )
    reservation_creation_status = AnnotatedField(
        graphene.Enum.from_enum(ApplicationRoundReservationCreationStatusChoice),
        expression=L("reservation_creation_status"),
    )
    is_setting_handled_allowed = AnnotatedField(
        graphene.Boolean,
        expression=L("is_setting_handled_allowed"),
    )
    applications_count = AnnotatedField(
        graphene.Int,
        expression=models.Count(
            "applications",
            filter=models.Q(applications__cancelled_date__isnull=True, applications__sent_date__isnull=False),
        ),
    )
    reservation_unit_count = AnnotatedField(
        graphene.Int,
        expression=models.Count("reservation_units"),
    )

    class Meta:
        model = ApplicationRound
        fields = [
            "pk",
            "name",
            "target_group",
            "terms_of_use",
            "criteria",
            "notes_when_applying",
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
            "reservation_creation_status",
            "is_setting_handled_allowed",
        ]
        filterset_class = ApplicationRoundFilterSet
        permission_classes = [ApplicationRoundPermission]

    def resolve_is_setting_handled_allowed(root: ApplicationRound, info: GQLInfo) -> bool:
        if not ApplicationRoundPermission.has_update_permission(root, info.context.user, {}):
            return False

        return root.is_setting_handled_allowed
