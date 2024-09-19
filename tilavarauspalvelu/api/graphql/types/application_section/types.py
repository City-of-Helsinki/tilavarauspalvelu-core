import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField
from query_optimizer.optimizer import QueryOptimizer

from applications.enums import ApplicationSectionStatusChoice
from applications.models import Application, ApplicationSection
from applications.querysets.application import ApplicationQuerySet
from applications.querysets.application_section import ApplicationSectionQuerySet
from common.typing import GQLInfo
from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import User

from .filtersets import ApplicationSectionFilterSet
from .permissions import ApplicationSectionPermission


class ApplicationSectionNode(DjangoNode):
    status = AnnotatedField(graphene.Enum.from_enum(ApplicationSectionStatusChoice), expression=L("status"))
    allocations = AnnotatedField(graphene.Int, expression=L("allocations"))

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "name",
            "num_persons",
            "reservations_begin_date",
            "reservations_end_date",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "allocations",
            "age_group",
            "purpose",
            "application",
            "reservation_unit_options",
            "suitable_time_ranges",
            "status",
        ]
        filterset_class = ApplicationSectionFilterSet
        permission_classes = [ApplicationSectionPermission]
        max_complexity = 14

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
            models.Q(application__user=user)
            | models.Q(reservation_unit_options__reservation_unit__unit__in=u_ids)
            | models.Q(reservation_unit_options__reservation_unit__unit__unit_groups__in=g_ids)
        ).distinct()

    @classmethod
    def pre_optimization_hook(cls, queryset: ApplicationSectionQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        # Fetch the application and its units for permission checks
        application_optimizer = optimizer.get_or_set_child_optimizer(
            "application",
            QueryOptimizer(
                Application,
                info=optimizer.info,
                name="application",
                parent=optimizer,
            ),
        )
        application_optimizer.manual_optimizers["units_for_permissions"] = cls._add_units_for_permissions

        # Add user id for permission checks
        user_optimizer = application_optimizer.get_or_set_child_optimizer(
            "user",
            QueryOptimizer(
                User,
                info=optimizer.info,
                name="user",
                parent=application_optimizer,
            ),
        )
        user_optimizer.only_fields.append("id")
        return queryset

    @classmethod
    def _add_units_for_permissions(cls, queryset: ApplicationQuerySet, optimizer: QueryOptimizer) -> models.QuerySet:
        return queryset.with_permissions()
