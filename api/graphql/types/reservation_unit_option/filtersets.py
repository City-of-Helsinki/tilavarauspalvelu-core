from graphene_django_extensions.filters import IntMultipleChoiceFilter, ModelFilterSet

from applications.models import ReservationUnitOption


class ReservationUnitOptionFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
        ]
