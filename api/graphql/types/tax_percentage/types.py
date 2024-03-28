from graphene_django_extensions import DjangoNode

from api.graphql.types.tax_percentage.filtersets import TaxPercentageFilterSet
from reservation_units.models import TaxPercentage

from .permissions import TaxPercentagePermission

__all__ = [
    "TaxPercentageNode",
]


class TaxPercentageNode(DjangoNode):
    class Meta:
        model = TaxPercentage
        fields = [
            "pk",
            "value",
        ]
        filterset_class = TaxPercentageFilterSet
        permission_classes = [TaxPercentagePermission]
