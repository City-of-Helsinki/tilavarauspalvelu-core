from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from django.db.models import Q
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField
from query_optimizer.optimizer import QueryOptimizer

from tilavarauspalvelu.api.graphql.types.application_section.types import ApplicationSectionNode
from tilavarauspalvelu.api.graphql.types.user.types import ApplicantNode
from tilavarauspalvelu.enums import ApplicationStatusChoice, UserRoleChoice
from tilavarauspalvelu.models import Application, ApplicationRound, User

from .filtersets import ApplicationFilterSet
from .permissions import ApplicationPermission

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "ApplicationNode",
]


class ApplicationNode(DjangoNode):
    status = AnnotatedField(graphene.Enum.from_enum(ApplicationStatusChoice), expression=L("status"), required=True)

    application_sections = ApplicationSectionNode.ListField()
    user = ApplicantNode.RelatedField()

    class Meta:
        model = Application
        fields = [
            "pk",
            "applicant_type",
            "additional_information",
            "working_memo",
            #
            "billing_street_address",
            "billing_post_code",
            "billing_city",
            #
            "organisation_name",
            "organisation_email",
            "organisation_identifier",
            "organisation_year_established",
            "organisation_active_members",
            "organisation_core_business",
            "organisation_street_address",
            "organisation_post_code",
            "organisation_city",
            #
            # Contact person
            "contact_person_first_name",
            "contact_person_last_name",
            "contact_person_email",
            "contact_person_phone_number",
            #
            # Datetimes
            "cancelled_at",
            "sent_at",
            "created_at",
            "updated_at",
            #
            # Lookup properties
            "status",
            #
            # Relations
            "application_round",
            "application_sections",
            "user",
            "municipality",
        ]
        restricted_fields = {
            "working_memo": lambda user, application: user.permissions.can_view_application(
                application, reserver_needs_role=True
            ),
        }
        filterset_class = ApplicationFilterSet
        permission_classes = [ApplicationPermission]
        max_complexity = 24

    @classmethod
    def pre_optimization_hook(cls, queryset: ApplicationQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        queryset = queryset.with_permissions()

        # Add user id for permission checks
        user_optimizer = optimizer.get_or_set_child_optimizer(
            "user",
            QueryOptimizer(
                User,
                info=optimizer.info,
                name="user",
                parent=optimizer,
            ),
        )
        user_optimizer.only_fields.append("id")

        # Add application period end for the "can_manage_application" permission check
        application_round_optimizer = optimizer.get_or_set_child_optimizer(
            "application_round",
            QueryOptimizer(
                ApplicationRound,
                info=optimizer.info,
                name="application_round",
                parent=optimizer,
            ),
        )
        application_round_optimizer.only_fields.append("application_period_ends_at")

        return queryset

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        user = info.context.user

        if user.is_anonymous or not user.is_active:
            return queryset.none()
        if user.is_superuser:
            return queryset

        roles = UserRoleChoice.can_view_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return queryset

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return queryset.filter(
            Q(user=user)
            | Q(application_sections__reservation_unit_options__reservation_unit__unit__in=u_ids)
            | Q(application_sections__reservation_unit_options__reservation_unit__unit__unit_groups__in=g_ids)
        ).distinct()
