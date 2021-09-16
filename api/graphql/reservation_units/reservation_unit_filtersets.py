import django_filters
from django.db.models import Sum

from api.common_filters import ModelInFilter
from reservation_units.models import ReservationUnit, ReservationUnitType
from spaces.models import Unit


class ReservationUnitsFilterSet(django_filters.FilterSet):
    unit = ModelInFilter(field_name="unit", queryset=Unit.objects.all())
    reservation_unit_type = ModelInFilter(
        field_name="reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )
    max_persons_gte = django_filters.NumberFilter(
        field_name="max_persons", method="get_max_persons_gte"
    )
    max_persons_lte = django_filters.NumberFilter(
        field_name="max_persons", method="get_max_persons_lte"
    )

    class Meta:
        model = ReservationUnit
        fields = [
            "unit",
        ]

    def get_max_persons_gte(self, qs, property, value):
        return qs.annotate(max_person_sum=Sum("spaces__max_persons")).filter(
            max_person_sum__gte=value
        )

    def get_max_persons_lte(self, qs, property, value):
        return qs.annotate(max_person_sum=Sum("spaces__max_persons")).filter(
            max_person_sum__lte=value
        )
