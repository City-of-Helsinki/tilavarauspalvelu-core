import operator
from functools import reduce

import django_filters
from django.db.models import Case, CharField, F, Q
from django.db.models import Value as V
from django.db.models import When
from django.db.models.functions import Concat

from applications.models import CUSTOMER_TYPES
from merchants.models import PaymentStatus
from permissions.helpers import (
    get_service_sectors_where_can_view_reservations,
    get_units_where_can_view_reservations,
)
from reservation_units.models import ReservationUnit, ReservationUnitType
from reservations.models import STATE_CHOICES, Reservation, User
from spaces.models import Unit


class ReservationFilterSet(django_filters.FilterSet):
    begin = django_filters.DateTimeFilter(field_name="begin", lookup_expr="gte")
    end = django_filters.DateTimeFilter(field_name="end", lookup_expr="lte")
    price_gte = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_lte = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
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

    unit = django_filters.ModelMultipleChoiceFilter(
        method="get_unit", queryset=Unit.objects.all()
    )

    reservation_unit = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit", queryset=ReservationUnit.objects.all()
    )

    reservation_unit_type = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )

    text_search = django_filters.CharFilter(method="get_text_search")

    order_status = django_filters.MultipleChoiceFilter(
        field_name="payment_order__status",
        lookup_expr="iexact",
        choices=tuple(
            (
                key,
                value,
            )
            for key, value in PaymentStatus.choices
        ),
        label="PaymentOrder's statuses; %s"
        % ", ".join([k for k, v in PaymentStatus.choices]),
    )

    order_by = django_filters.OrderingFilter(
        fields=(
            "created_at",
            "state",
            "begin",
            "end",
            "name",
            "price",
            "pk",
            ("reservation_unit__name_fi", "reservation_unit_name_fi"),
            ("reservation_unit__name_en", "reservation_unit_name_en"),
            ("reservation_unit__name_sv", "reservation_unit_name_sv"),
            ("reservation_unit__unit__name_fi", "unit_name_fi"),
            ("reservation_unit__unit__name_en", "unit_name_en"),
            ("reservation_unit__unit__name_sv", "unit_name_sv"),
            "reservee_name",
            ("payment_order__status", "order_status"),
        )
    )

    class Meta:
        model = Reservation
        fields = ["begin", "end"]

    def filter_queryset(self, queryset):
        queryset = queryset.alias(
            reservee_name=Case(
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
                    then=Concat(
                        "reservee_first_name",
                        V(" "),
                        "reservee_last_name",
                    ),
                ),
                default=V(""),
                output_field=CharField(),
            )
        )

        return super().filter_queryset(queryset)

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
        if user.is_anonymous:
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

    def get_unit(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(reservation_unit__unit__in=value)

    def get_reservation_unit(self, qs, property, value):
        if not value:
            return qs

        return qs.filter(reservation_unit__in=value)

    def get_reservation_unit_type(self, qs, property, value):
        if not value:
            return qs
        return qs.filter(reservation_unit__reservation_unit_type__in=value)

    def get_text_search(serlf, qs, property, value: str):
        if not value:
            return qs

        if value.isnumeric():
            return qs.filter(pk=value)

        queryset = qs.alias(
            reservee_name=Case(
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
                    then=Concat("reservee_first_name", V(" "), "reservee_last_name"),
                ),
                default=V(""),
                output_field=CharField(),
            )
        )

        return queryset.filter(
            Q(name__icontains=value) | Q(reservee_name__icontains=value)
        )
