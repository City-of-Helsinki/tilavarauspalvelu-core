import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from api.graphql.types.application_section.filtersets import ApplicationSectionFilterSet
from api.graphql.types.application_section.permissions import ApplicationSectionPermission
from applications.enums import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from common.typing import GQLInfo
from permissions.helpers import has_any_general_permission
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices


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
            models.Q(application__user=user)
            | models.Q(reservation_unit_options__reservation_unit__unit__in=unit_ids)
            | models.Q(reservation_unit_options__reservation_unit__unit__unit_groups__in=unit_group_ids)
        ).distinct()
