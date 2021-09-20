import operator
from functools import reduce

import django_filters
from django.db.models import Q, Sum
from django_filters import CharFilter

from api.common_filters import ModelInFilter
from reservation_units.models import KeywordGroup, ReservationUnit, ReservationUnitType
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

    text_search = CharFilter(method="get_text_search")

    keyword_groups = ModelInFilter(
        field_name="keyword_groups", queryset=KeywordGroup.objects.all()
    )

    class Meta:
        model = ReservationUnit
        fields = ["unit", "keyword_groups"]

    def get_text_search(self, qs, property, value: str):

        words = value.split(",")
        queries = []
        for word in words:
            queries.append(
                Q(name__icontains=word)
                | Q(description__icontains=word)
                | Q(spaces__name__icontains=word)
                | Q(keyword_groups__name__icontains=word)
                | Q(resources__name__icontains=word)
                | Q(services__name__icontains=word)
                | Q(purposes__name__icontains=word)
                | Q(reservation_unit_type__name__icontains=word)
                | Q(equipments__name__icontains=word)
                | Q(unit__name__icontains=word)
            )
        query = reduce(operator.or_, (query for query in queries))

        return qs.filter(query)

    def get_max_persons_gte(self, qs, property, value):
        return qs.annotate(max_person_sum=Sum("spaces__max_persons")).filter(
            max_person_sum__gte=value
        )

    def get_max_persons_lte(self, qs, property, value):
        return qs.annotate(max_person_sum=Sum("spaces__max_persons")).filter(
            max_person_sum__lte=value
        )
