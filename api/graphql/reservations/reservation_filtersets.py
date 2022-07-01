import operator
from functools import reduce

import django_filters
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q

from permissions.helpers import (
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservations.models import STATE_CHOICES, Reservation, User
from spaces.models import ServiceSector, Unit


class ReservationFilterSet(django_filters.FilterSet):
    begin = django_filters.DateTimeFilter(field_name="begin", lookup_expr="gte")
    end = django_filters.DateTimeFilter(field_name="end", lookup_expr="lte")
    state = django_filters.MultipleChoiceFilter(
        field_name="state",
        lookup_expr="iexact",
        choices=tuple(
            (
                key.upper(),  # Must use upper case characters to comply with GraphQL Enum
                value,
            )
            for key, value in STATE_CHOICES.STATE_CHOICES
        ),
    )

    # Filter for displaying reservations which requires or had required handling.
    requested = django_filters.BooleanFilter(method="get_requested")

    only_with_permission = django_filters.BooleanFilter(
        method="get_only_with_permission"
    )

    user = django_filters.ModelChoiceFilter(
        field_name="user", queryset=User.objects.all()
    )

    reservation_unit_name_fi = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )
    reservation_unit_name_en = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )
    reservation_unit_name_sv = django_filters.CharFilter(
        method="get_reservation_unit_name"
    )

    order_by = django_filters.OrderingFilter(
        fields=(
            "state",
            "begin",
            "end",
            "name",
            "price",
            "pk",
        )
    )

    class Meta:
        model = Reservation
        fields = ["begin", "end"]

    def get_requested(self, qs, property, value: str):
        query = Q(state=STATE_CHOICES.REQUIRES_HANDLING) | Q(handled_at__isnull=False)
        if value:
            return qs.filter(query)
        return qs.exclude(query)

    def get_only_with_permission(self, qs, property, value: bool):
        if not value:
            return qs

        user = self.request.user
        viewable_units = get_units_where_can_view_reservations(user)
        viewable_service_sectors = get_service_sectors_where_can_view_reservations(user)
        if settings.TMP_PERMISSIONS_DISABLED:
            viewable_units = Unit.objects.all()
            viewable_service_sectors = ServiceSector.objects.all()
            user = (
                get_user_model().objects.get(username="admin")
                if settings.TMP_PERMISSIONS_DISABLED
                else user
            )
        elif user.is_anonymous:
            return qs.none()
        return qs.filter(
            Q(reservation_unit__unit__in=viewable_units)
            | Q(reservation_unit__unit__service_sectors__in=viewable_service_sectors)
            | Q(user=user)
        ).distinct()

    def get_reservation_unit_name(self, qs, property: str, value: str):
        language = property[-2:]
        words = value.split(",")
        queries = []
        for word in words:
            word = word.strip()
            if language == "en":
                queries.append(Q(reservation_unit__name_en__istartswith=word))
            elif language == "sv":
                queries.append(Q(reservation_unit__name_sv__istartswith=word))
            else:
                queries.append(Q(reservation_unit__name_fi__istartswith=word))

        query = reduce(operator.or_, (query for query in queries))
        return qs.filter(query).distinct()
