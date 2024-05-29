from graphene_django_extensions import DjangoNode

from reservations.models import RejectedOccurrence

from .filtersets import RejectedOccurrenceFilterSet
from .permissions import RejectedOccurrencePermission


class RejectedOccurrenceNode(DjangoNode):
    class Meta:
        model = RejectedOccurrence
        fields = [
            "pk",
            "begin_datetime",
            "end_datetime",
            "rejection_reason",
            "created_at",
            "recurring_reservation",
        ]
        filterset_class = RejectedOccurrenceFilterSet
        permission_classes = [RejectedOccurrencePermission]
