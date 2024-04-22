import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from api.graphql.types.application_section.filtersets import ApplicationSectionFilterSet
from api.graphql.types.application_section.permissions import ApplicationSectionPermission
from applications.choices import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from common.typing import GQLInfo
from permissions.helpers import get_units_where_can_view_applications


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
        units = get_units_where_can_view_applications(info.context.user)

        return queryset.filter(
            models.Q(reservation_unit_options__reservation_unit__unit__in=units)
            | models.Q(application__user=info.context.user)
        ).distinct()
