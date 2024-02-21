from typing import Any

import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.fields import RelatedField
from graphene_django_extensions.utils import get_fields_from_info, get_nested
from lookup_property import L

from api.graphql.types.application_section.filtersets import ApplicationSectionFilterSet
from api.graphql.types.application_section.permissions import ApplicationSectionPermission
from api.graphql.types.reservation_unit_option.types import ReservationUnitOptionNode
from api.graphql.types.suitable_time_range.types import SuitableTimeRangeNode
from applications.choices import ApplicationSectionStatusChoice
from applications.models import ApplicationSection
from common.typing import GQLInfo
from permissions.helpers import get_service_sectors_where_can_view_applications, get_units_where_can_view_applications


class ApplicationSectionNode(DjangoNode):
    status = graphene.Field(graphene.Enum.from_enum(ApplicationSectionStatusChoice))
    allocations = graphene.Field(graphene.Int)

    related_application_sections = graphene.List(lambda: ApplicationSectionNode)
    reservation_unit_options = ReservationUnitOptionNode.ListField()
    suitable_time_ranges = SuitableTimeRangeNode.ListField()
    purpose = RelatedField("api.graphql.types.reservations.types.ReservationPurposeType")
    age_group = RelatedField("api.graphql.types.reservations.types.AgeGroupType")

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

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        queryset = cls.optimize_computed_properties(queryset, info)

        units = get_units_where_can_view_applications(info.context.user)
        service_sectors = get_service_sectors_where_can_view_applications(info.context.user)

        return queryset.filter(
            models.Q(application__application_round__service_sector__in=service_sectors)
            | models.Q(reservation_unit_options__reservation_unit__unit__in=units)
            | models.Q(application__user=info.context.user)
        ).distinct()

    @classmethod
    def optimize_computed_properties(cls, queryset: models.QuerySet, info: GQLInfo):
        field_info = get_fields_from_info(info)
        selections = get_nested(field_info, 0, "applicationSections", 0, "edges", 0, "node", 0, default=[])

        if "status" in selections:
            queryset = queryset.annotate(status=L("status"))
        if "allocations" in selections:
            queryset = queryset.annotate(allocations=L("allocations"))

        return queryset

    def resolve_related_application_sections(root: ApplicationSection, info: GQLInfo, **kwargs: Any) -> models.QuerySet:
        return root.actions.application_sections_affecting_allocations()
