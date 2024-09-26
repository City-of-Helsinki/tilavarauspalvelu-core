import graphene
from django.db import models
from django.db.models import Q
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField
from query_optimizer.optimizer import QueryOptimizer

from applications.enums import ApplicationStatusChoice
from applications.models import Application, ApplicationRound
from applications.querysets.application import ApplicationQuerySet
from common.typing import GQLInfo
from permissions.enums import UserRoleChoice
from tilavarauspalvelu.api.graphql.types.application_section.types import ApplicationSectionNode
from tilavarauspalvelu.api.graphql.types.user.types import ApplicantNode
from tilavarauspalvelu.models import User

from .filtersets import ApplicationFilterSet
from .permissions import ApplicationPermission

__all__ = [
    "ApplicationNode",
]


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
            "working_memo": lambda user, application: user.permissions.can_view_application(
                application, reserver_needs_role=True
            ),
        }
        filterset_class = ApplicationFilterSet
        permission_classes = [ApplicationPermission]
        max_complexity = 22

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
        application_round_optimizer.only_fields.append("application_period_end")

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
