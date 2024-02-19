import django_filters
from graphene_django_extensions import ModelFilterSet

from applications.models import ApplicationRound
from common.filtersets import IntMultipleChoiceFilter


class ApplicationRoundFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    name = django_filters.CharFilter(lookup_expr="istartswith")

    class Meta:
        model = ApplicationRound
