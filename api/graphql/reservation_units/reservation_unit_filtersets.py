import datetime
import operator
from functools import reduce

import django_filters
from django.db.models import Q, Sum
from django.utils.timezone import get_default_timezone
from django_filters import CharFilter

from reservation_units.models import (
    KeywordGroup,
    Purpose,
    ReservationUnit,
    ReservationUnitType,
)
from spaces.models import Unit


class ReservationUnitsFilterSet(django_filters.FilterSet):
    unit = django_filters.ModelMultipleChoiceFilter(
        field_name="unit", queryset=Unit.objects.all()
    )
    reservation_unit_type = django_filters.ModelMultipleChoiceFilter(
        field_name="reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )
    max_persons_gte = django_filters.NumberFilter(
        field_name="max_persons", method="get_max_persons_gte"
    )
    max_persons_lte = django_filters.NumberFilter(
        field_name="max_persons", method="get_max_persons_lte"
    )

    text_search = CharFilter(method="get_text_search")

    keyword_groups = django_filters.ModelMultipleChoiceFilter(
        field_name="keyword_groups", queryset=KeywordGroup.objects.all()
    )

    purposes = django_filters.ModelMultipleChoiceFilter(
        field_name="purposes", queryset=Purpose.objects.all()
    )

    is_draft = django_filters.BooleanFilter(field_name="is_draft")

    is_visible = django_filters.BooleanFilter(method="get_is_visible")

    order_by = django_filters.OrderingFilter(
        fields=(
            "name_fi",
            "name_en",
            "name_sv",
            ("reservation_unit_type__name_fi", "type_fi"),
            ("reservation_unit_type__name_en", "type_en"),
            ("reservation_unit_type__name_sv", "type_sv"),
            ("unit__name_fi", "unit_name_fi"),
            ("unit__name_en", "unit_name_en"),
            ("unit__name_sv", "unit_name_sv"),
        )
    )

    class Meta:
        model = ReservationUnit
        fields = ["unit", "keyword_groups"]

    def get_text_search(self, qs, property, value: str):

        words = value.split(",")
        queries = []
        for word in words:
            queries.append(
                Q(name_fi__icontains=word)
                | Q(name_en__icontains=word)
                | Q(name_sv__icontains=word)
                | Q(description_fi__icontains=word)
                | Q(description_en__icontains=word)
                | Q(description_sv__icontains=word)
                | Q(spaces__name_fi__icontains=word)
                | Q(spaces__name_en__icontains=word)
                | Q(spaces__name_sv__icontains=word)
                | Q(keyword_groups__name_fi__icontains=word)
                | Q(keyword_groups__name_en__icontains=word)
                | Q(keyword_groups__name_sv__icontains=word)
                | Q(resources__name_fi__icontains=word)
                | Q(resources__name_en__icontains=word)
                | Q(resources__name_sv__icontains=word)
                | Q(services__name_fi__icontains=word)
                | Q(services__name_en__icontains=word)
                | Q(services__name_sv__icontains=word)
                | Q(purposes__name_fi__icontains=word)
                | Q(purposes__name_en__icontains=word)
                | Q(purposes__name_sv__icontains=word)
                | Q(reservation_unit_type__name_fi__icontains=word)
                | Q(reservation_unit_type__name_en__icontains=word)
                | Q(reservation_unit_type__name_sv__icontains=word)
                | Q(equipments__name_fi__icontains=word)
                | Q(equipments__name_en__icontains=word)
                | Q(equipments__name_sv__icontains=word)
                | Q(unit__name_fi__icontains=word)
                | Q(unit__name_en__icontains=word)
                | Q(unit__name_sv__icontains=word)
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

    def get_is_visible(self, qs, property, value):
        today = datetime.datetime.now(tz=get_default_timezone())
        qs = qs.filter(is_draft=False)
        published = (Q(publish_begins__lte=today) | Q(publish_begins__isnull=True)) & (
            Q(publish_ends__gt=today) | Q(publish_ends__isnull=True)
        )

        if value:
            return qs.filter(published)
        return qs.exclude(published)
