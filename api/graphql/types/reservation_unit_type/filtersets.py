from django.db.models import QuerySet
from graphene_django_extensions import ModelFilterSet

from reservation_units.models import ReservationUnitType


class ReservationUnitTypeFilterSet(ModelFilterSet):
    class Meta:
        model = ReservationUnitType
        fields = {
            "name_fi": ["exact", "icontains", "istartswith"],
            "name_sv": ["exact", "icontains", "istartswith"],
            "name_en": ["exact", "icontains", "istartswith"],
        }
        order_by = [
            "rank",
            "name_fi",
            "name_en",
            "name_sv",
        ]

    def filter_queryset(self, queryset: QuerySet) -> QuerySet:
        return super().filter_queryset(queryset.order_by("rank"))
