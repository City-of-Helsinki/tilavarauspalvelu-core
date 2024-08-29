import re
from typing import TYPE_CHECKING

import django_filters
from django.db import models
from django.db.models import Case, CharField, F, Q, QuerySet, Value, When
from django.db.models.functions import Concat
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntMultipleChoiceFilter

from api.graphql.extensions.filters import TimezoneAwareDateFilter
from common.db import text_search
from merchants.enums import OrderStatusWithFree
from permissions.helpers import has_general_permission
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices
from reservations.enums import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation

if TYPE_CHECKING:
    from common.typing import AnyUser

EMAIL_DOMAIN_PATTERN = re.compile(r"^@\w[.\w]{0,254}$")
"""
Matches email domains like:
- @email.com
- @email.co.uk
- @localhost
"""


class ReservationFilterSet(ModelFilterSet):
    reservation_unit = IntMultipleChoiceFilter(field_name="reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="reservation_unit__unit")
    user = IntMultipleChoiceFilter(field_name="user")
    reservation_unit_type = IntMultipleChoiceFilter(field_name="reservation_unit__reservation_unit_type")
    recurring_reservation = IntMultipleChoiceFilter(field_name="recurring_reservation")

    reservation_unit_name_fi = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_en = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_sv = django_filters.CharFilter(method="filter_by_reservation_unit_name")

    begin_date = TimezoneAwareDateFilter(field_name="end", lookup_expr="gte", use_end_of_day=False)
    end_date = TimezoneAwareDateFilter(field_name="begin", lookup_expr="lte", use_end_of_day=True)

    created_at_gte = TimezoneAwareDateFilter(field_name="created_at", lookup_expr="gte", use_end_of_day=False)
    created_at_lte = TimezoneAwareDateFilter(field_name="created_at", lookup_expr="lte", use_end_of_day=True)

    price_gte = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_lte = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    applying_for_free_of_charge = django_filters.BooleanFilter(field_name="applying_for_free_of_charge")
    is_recurring = django_filters.BooleanFilter(field_name="recurring_reservation", lookup_expr="isnull", exclude=True)
    requested = django_filters.BooleanFilter(method="filter_by_requested")
    only_with_permission = django_filters.BooleanFilter(method="filter_by_only_with_permission")
    only_with_handling_permission = django_filters.BooleanFilter(method="filter_by_only_with_handling_permission")

    state = EnumMultipleChoiceFilter(field_name="state", enum=ReservationStateChoice)
    reservation_type = EnumMultipleChoiceFilter(field_name="type", enum=ReservationTypeChoice)
    order_status = EnumMultipleChoiceFilter(enum=OrderStatusWithFree, method="filter_by_order_status")

    text_search = django_filters.CharFilter(method="filter_by_text_search")

    class Meta:
        model = Reservation
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

    def filter_by_only_with_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        if not value:
            return qs

        user: AnyUser = self.request.user
        if user.is_anonymous:
            return qs.none()
        if user.is_superuser:
            return qs
        if has_general_permission(user, GeneralPermissionChoices.CAN_VIEW_RESERVATIONS):
            return qs

        unit_permission = UnitPermissionChoices.CAN_VIEW_RESERVATIONS.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return qs.filter(
            Q(reservation_unit__unit__in=unit_ids)  #
            | Q(reservation_unit__unit__unit_groups__in=unit_group_ids)
        )

    def filter_by_only_with_handling_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        if not value:
            return qs

        user: AnyUser = self.request.user

        if user.is_anonymous:
            return qs.none()
        if user.is_superuser:
            return qs
        if has_general_permission(user, GeneralPermissionChoices.CAN_MANAGE_RESERVATIONS):
            return qs

        unit_permission = UnitPermissionChoices.CAN_MANAGE_RESERVATIONS.value
        unit_ids = [pk for pk, perms in user.unit_permissions.items() if unit_permission in perms]
        unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if unit_permission in perms]

        return qs.filter(
            Q(reservation_unit__unit__in=unit_ids)  #
            | Q(reservation_unit__unit__unit_groups__in=unit_group_ids)
        )

    @staticmethod
    def filter_by_requested(qs: QuerySet, name, value: str) -> QuerySet:
        """Filter for displaying reservations which requires or had required handling."""
        query = Q(state=ReservationStateChoice.REQUIRES_HANDLING) | Q(handled_at__isnull=False)
        if value:
            return qs.filter(query)
        return qs.exclude(query)

    @staticmethod
    def filter_by_reservation_unit_name(qs: QuerySet, name: str, value: str) -> QuerySet:
        language = name[-2:]
        words = value.split(",")
        q = Q()
        for word in words:
            word = word.strip()
            if language == "en":
                q |= Q(reservation_unit__name_en__istartswith=word)
            elif language == "sv":
                q |= Q(reservation_unit__name_sv__istartswith=word)
            else:
                q |= Q(reservation_unit__name_fi__istartswith=word)

        return qs.filter(q).distinct()

    def filter_by_text_search(self, qs: QuerySet, name: str, value: str) -> QuerySet:
        value = value.strip()
        if not value:
            return qs

        # Shortcut for searching only emails
        if EMAIL_DOMAIN_PATTERN.match(value):
            return qs.filter(Q(user__email__icontains=value) | Q(reservee_email__icontains=value))

        if len(value) >= 3:
            fields = (
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
            return text_search(qs=qs, fields=fields, text=value)

        if value.isnumeric():
            return qs.filter(pk=int(value))

        return qs

    @staticmethod
    def filter_by_order_status(qs: QuerySet, name: str, value: list[str]) -> QuerySet:
        q = Q()
        if OrderStatusWithFree.FREE.value in value:
            value.remove(OrderStatusWithFree.FREE.value)
            q |= Q(payment_order__isnull=True)
        if value:
            q |= Q(payment_order__status__in=value)
        return qs.filter(q)

    @staticmethod
    def order_by_reservee_name(qs: QuerySet, desc: bool) -> QuerySet:
        return qs.alias(
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
        ).order_by(models.OrderBy(models.F("reservee_name"), descending=desc))
