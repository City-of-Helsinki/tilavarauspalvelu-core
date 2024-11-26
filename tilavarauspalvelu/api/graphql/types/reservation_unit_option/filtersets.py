from __future__ import annotations

from graphene_django_extensions.filters import IntMultipleChoiceFilter, ModelFilterSet

from tilavarauspalvelu.models import ReservationUnitOption


class ReservationUnitOptionFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    reservation_unit = IntMultipleChoiceFilter()
    preferred_order = IntMultipleChoiceFilter()

    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
            "reservation_unit",
        ]
