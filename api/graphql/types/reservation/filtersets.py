import operator
import re
from functools import reduce

import django_filters
from django.contrib.postgres.search import SearchRank, SearchVector
from django.db.models import Case, CharField, F, Q, QuerySet, Value, When
from django.db.models.functions import Concat
from graphene_django_extensions import ModelFilterSet

from api.graphql.extensions.filters import TimezoneAwareDateFilter
from common.db import raw_prefixed_query
from merchants.models import OrderStatus
from permissions.getters import get_units_with_permission
from permissions.helpers import get_units_where_can_view_reservations
from reservation_units.models import ReservationUnit, ReservationUnitType
from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.models import RecurringReservation, Reservation
from spaces.models import Unit
from users.models import User

EMAIL_DOMAIN_PATTERN = re.compile(r"^@\w[.\w]{0,254}$")
"""
Matches email domains like:
- @email.com
- @email.co.uk
- @localhost
"""


class ReservationFilterSet(ModelFilterSet):
    begin_date = TimezoneAwareDateFilter(field_name="end", lookup_expr="gte", use_end_of_day=False)
    end_date = TimezoneAwareDateFilter(field_name="begin", lookup_expr="lte", use_end_of_day=True)

    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")
    only_with_handling_permission = django_filters.BooleanFilter(method="get_only_with_handling_permission")

    order_status = django_filters.MultipleChoiceFilter(
        field_name="payment_order__status",
        lookup_expr="iexact",
        choices=tuple(
            (
                key,
                value,
            )
            for key, value in OrderStatus.choices
        ),
        label=f"PaymentOrder's statuses; {", ".join([k for k, v in OrderStatus.choices])}",
    )

    price_gte = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_lte = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    recurring_reservation = django_filters.ModelChoiceFilter(
        field_name="recurring_reservation", queryset=RecurringReservation.objects.all()
    )

    # Filter for displaying reservations which requires or had required handling.
    requested = django_filters.BooleanFilter(method="get_requested")

    reservation_unit = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit", queryset=ReservationUnit.objects.all()
    )

    reservation_type = django_filters.MultipleChoiceFilter(
        field_name="type",
        choices=ReservationTypeChoice.choices,
    )

    reservation_unit_name_fi = django_filters.CharFilter(method="get_reservation_unit_name")
    reservation_unit_name_en = django_filters.CharFilter(method="get_reservation_unit_name")
    reservation_unit_name_sv = django_filters.CharFilter(method="get_reservation_unit_name")

    reservation_unit_type = django_filters.ModelMultipleChoiceFilter(
        method="get_reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )

    state = django_filters.MultipleChoiceFilter(
        field_name="state",
        lookup_expr="iexact",
        choices=tuple(
            (
                key.upper(),  # Must use upper case characters to comply with GraphQL Enum
                value,
            )
            for key, value in ReservationStateChoice.choices
        ),
    )

    unit = django_filters.ModelMultipleChoiceFilter(method="get_unit", queryset=Unit.objects.all())
    user = django_filters.ModelChoiceFilter(field_name="user", queryset=User.objects.all())
    text_search = django_filters.CharFilter(method="get_text_search")

    class Meta:
        model = Reservation
        fields = {
            "state": ["exact"],
            "begin": ["exact", "gte", "lte"],
        }
        order_by = [
            "pk",
            "name",
            "begin",
            "end",
            "created_at",
            "state",
            "price",
            ("reservation_unit__name_fi", "reservation_unit_name_fi"),
            ("reservation_unit__name_en", "reservation_unit_name_en"),
            ("reservation_unit__name_sv", "reservation_unit_name_sv"),
            ("reservation_unit__unit__name_fi", "unit_name_fi"),
            ("reservation_unit__unit__name_en", "unit_name_en"),
            ("reservation_unit__unit__name_sv", "unit_name_sv"),
            "reservee_name",
            ("payment_order__status", "order_status"),
        ]

    def filter_queryset(self, queryset: QuerySet) -> QuerySet:
        queryset = queryset.alias(
            reservee_name=Case(
                When(
                    reservee_type=CustomerTypeChoice.BUSINESS,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CustomerTypeChoice.NONPROFIT,
                    then=F("reservee_organisation_name"),
                ),
                When(
                    reservee_type=CustomerTypeChoice.INDIVIDUAL,
                    then=Concat(
                        "reservee_first_name",
                        Value(" "),
                        "reservee_last_name",
                    ),
                ),
                default=Value(""),
                output_field=CharField(),
            )
        )

        return super().filter_queryset(queryset)

    def get_only_with_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        if not value:
            return qs

        user = self.request.user
        viewable_units = get_units_where_can_view_reservations(user)
        if user.is_anonymous:
            return qs.none()
        return qs.filter(Q(reservation_unit__unit__in=viewable_units) | Q(user=user)).distinct()

    def get_only_with_handling_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        if not value:
            return qs

        user = self.request.user
        if user.is_anonymous:
            return qs.none()

        units = get_units_with_permission(user, permission="can_manage_reservations")
        return qs.filter(Q(user=user) | Q(reservation_unit__unit__in=units)).distinct()

    def get_requested(self, qs: QuerySet, name, value: str) -> QuerySet:
        query = Q(state=ReservationStateChoice.REQUIRES_HANDLING) | Q(handled_at__isnull=False)
        if value:
            return qs.filter(query)
        return qs.exclude(query)

    def get_reservation_unit(self, qs: QuerySet, name, value) -> QuerySet:
        if not value:
            return qs

        return qs.filter(reservation_unit__in=value)

    def get_reservation_unit_name(self, qs: QuerySet, name: str, value: str) -> QuerySet:
        language = name[-2:]
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

    def get_reservation_unit_type(self, qs: QuerySet, name: str, value: list[str]) -> QuerySet:
        if not value:
            return qs
        return qs.filter(reservation_unit__reservation_unit_type__in=value)

    def get_text_search(self, qs: QuerySet, name: str, value: str) -> QuerySet:
        value = value.strip()
        if not value:
            return qs

        # Shortcut for searching only emails
        if EMAIL_DOMAIN_PATTERN.match(value):
            return qs.filter(Q(user__email__icontains=value) | Q(reservee_email__icontains=value))

        if len(value) >= 3:
            vector = SearchVector(
                "pk",
                "name",
                "reservee_id",
                "reservee_email",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_organisation_name",
                "user__email",
                "user__first_name",
                "user__last_name",
                "recurring_reservation__name",
            )
            query = raw_prefixed_query(value)
            text_search_rank = SearchRank(vector, query)
            return (
                qs.annotate(search=vector, text_search_rank=text_search_rank)
                .filter(search=query)
                .order_by("-text_search_rank")  # most relevant first
            )

        if value.isnumeric():
            return qs.filter(pk=int(value))

        return qs

    def get_unit(self, qs: QuerySet, name: str, value: list[int]) -> QuerySet:
        if not value:
            return qs

        return qs.filter(reservation_unit__unit__in=value)
