import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from api.graphql.types.application.filtersets import ApplicationFilterSet
from api.graphql.types.application.permissions import ApplicationPermission
from api.graphql.types.application_section.types import ApplicationSectionNode
from api.graphql.types.user.types import ApplicantNode
from applications.choices import ApplicationStatusChoice
from applications.models import Application
from common.typing import GQLInfo
from permissions.helpers import can_access_application_private_fields, has_any_general_permission

__all__ = [
    "ApplicationNode",
]

from permissions.models import GeneralPermissionChoices, UnitPermissionChoices


class ApplicationNode(DjangoNode):
    status = AnnotatedField(graphene.Enum.from_enum(ApplicationStatusChoice), expression=L("status"))

    application_sections = ApplicationSectionNode.ListField()
    user = ApplicantNode.RelatedField()

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
        user = info.context.user

        if user.is_anonymous:
            return queryset.none()
        if user.is_superuser:
            return queryset
        if has_any_general_permission(user, GeneralPermissionChoices.handle_or_validate_applications):
            return queryset

        unit_permission = UnitPermissionChoices.CAN_VALIDATE_APPLICATIONS.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return queryset.filter(
            models.Q(user=user)
            | models.Q(application_sections__reservation_unit_options__reservation_unit__unit__in=unit_ids)
            | models.Q(
                application_sections__reservation_unit_options__reservation_unit__unit__unit_groups__in=unit_group_ids
            )
        ).distinct()
