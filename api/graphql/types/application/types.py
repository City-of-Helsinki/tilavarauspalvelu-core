import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import required_annotations

from api.graphql.types.application.filtersets import ApplicationFilterSet
from api.graphql.types.application.permissions import ApplicationPermission
from api.graphql.types.application_section.types import ApplicationSectionNode
from api.graphql.types.users.types import ApplicantNode
from applications.choices import ApplicationStatusChoice
from applications.models import Application
from common.typing import GQLInfo
from permissions.helpers import (
    can_access_application_private_fields,
    get_service_sectors_where_can_view_applications,
    get_units_where_can_view_applications,
)

__all__ = [
    "ApplicationNode",
]


class ApplicationNode(DjangoNode):
    status = graphene.Field(graphene.Enum.from_enum(ApplicationStatusChoice))

    user = ApplicantNode.RelatedField()
    application_sections = ApplicationSectionNode.ListField()

    class Meta:
        model = Application
        fields = [
            "pk",
            "applicant_type",
            "created_date",
            "last_modified_date",
            "cancelled_date",
            "sent_date",
            "additional_information",
            "working_memo",
            "application_round",
            "organisation",
            "contact_person",
            "user",
            "billing_address",
            "home_city",
            "application_sections",
            "status",
        ]
        restricted_fields = {
            "working_memo": can_access_application_private_fields,
        }
        filterset_class = ApplicationFilterSet
        permission_classes = [ApplicationPermission]
        max_complexity = 22

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        units = get_units_where_can_view_applications(info.context.user)
        service_sectors = get_service_sectors_where_can_view_applications(info.context.user)

        return queryset.filter(
            models.Q(application_round__service_sector__in=service_sectors)
            | models.Q(application_sections__reservation_unit_options__reservation_unit__unit__in=units)
            | models.Q(user=info.context.user)
        ).distinct()

    @required_annotations(status=L("status"))
    def resolve_status(root: Application, info: GQLInfo) -> ApplicationStatusChoice:
        return root.status
