import django_filters

from api.common_filters import ModelInFilter
from reservation_units.models import ReservationUnit, ReservationUnitType
from spaces.models import Unit


class ReservationUnitsFilterSet(django_filters.FilterSet):
    unit = ModelInFilter(field_name="unit", queryset=Unit.objects.all())
    reservation_unit_type = ModelInFilter(
        field_name="reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )

    class Meta:
        model = ReservationUnit
        fields = [
            "unit",
        ]
