from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from api.graphql.types.suitable_time_range.filtersets import SuitableTimeRangeFilterSet
from applications.models import SuitableTimeRange


class SuitableTimeRangeNode(DjangoNode):
    class Meta:
        model = SuitableTimeRange
        fields = [
            "pk",
            "priority",
            "day_of_the_week",
            "begin_time",
            "end_time",
            "application_section",
        ]
        filterset_class = SuitableTimeRangeFilterSet
        permission_classes = [AllowAuthenticated]
