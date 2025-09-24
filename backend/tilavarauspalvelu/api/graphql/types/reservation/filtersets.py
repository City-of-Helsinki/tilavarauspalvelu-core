from __future__ import annotations

import re
from typing import TYPE_CHECKING

import django_filters
from django.db.models import Q
from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import EnumMultipleChoiceFilter, IntMultipleChoiceFilter
from lookup_property import L

from tilavarauspalvelu.enums import OrderStatusWithFree, ReservationStateChoice, ReservationTypeChoice, UserRoleChoice
from tilavarauspalvelu.models import Reservation
from utils.db import text_search
from utils.fields.filters import TimezoneAwareDateFilter
from utils.utils import log_text_search

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import AnyUser

EMAIL_DOMAIN_PATTERN = re.compile(r"^@\w[.\w]{0,254}$")
"""
Matches email domains like:
- @email.com
- @email.co.uk
- @localhost
"""


class ReservationFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()
    ext_uuid = django_filters.UUIDFilter()

    reservation_units = IntMultipleChoiceFilter(field_name="reservation_unit")
    unit = IntMultipleChoiceFilter(field_name="reservation_unit__unit")
    user = IntMultipleChoiceFilter(field_name="user")
    reservation_unit_type = IntMultipleChoiceFilter(field_name="reservation_unit__reservation_unit_type")
    reservation_series = IntMultipleChoiceFilter(field_name="reservation_series")

    reservation_unit_name_fi = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_en = django_filters.CharFilter(method="filter_by_reservation_unit_name")
    reservation_unit_name_sv = django_filters.CharFilter(method="filter_by_reservation_unit_name")

    begin_date = TimezoneAwareDateFilter(field_name="ends_at", lookup_expr="gte", use_end_of_day=False)
    end_date = TimezoneAwareDateFilter(field_name="begins_at", lookup_expr="lte", use_end_of_day=True)

    created_at_gte = TimezoneAwareDateFilter(field_name="created_at", lookup_expr="gte", use_end_of_day=False)
    created_at_lte = TimezoneAwareDateFilter(field_name="created_at", lookup_expr="lte", use_end_of_day=True)

    price_gte = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    price_lte = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    applying_for_free_of_charge = django_filters.BooleanFilter(field_name="applying_for_free_of_charge")
    is_recurring = django_filters.BooleanFilter(field_name="reservation_series", lookup_expr="isnull", exclude=True)
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
            "begins_at",
            "ends_at",
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
        if user.is_anonymous or not user.is_active:
            return qs.none()
        if user.is_superuser:
            return qs

        roles = UserRoleChoice.can_view_reservations()
        reserver_roles = UserRoleChoice.can_create_staff_reservations()

        if user.permissions.has_general_role(role_choices=roles):
            return qs

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        reserver_u_ids = user.permissions.unit_ids_where_has_role(role_choices=reserver_roles)
        reserver_g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=reserver_roles)

        return qs.filter(
            # Either has "can_view_reservations" permissions
            Q(reservation_unit__unit__in=u_ids)  #
            | Q(reservation_unit__unit__unit_groups__in=g_ids)
            # ...or is the owner of the reservation, and has "can_create_staff_reservations" permissions to it
            | (
                Q(user=user)
                & (
                    Q(reservation_unit__unit__in=reserver_u_ids)  #
                    | Q(reservation_unit__unit__unit_groups__in=reserver_g_ids)
                )
            )
        ).distinct()

    def filter_by_only_with_handling_permission(self, qs: QuerySet, name: str, value: bool) -> QuerySet:
        if not value:
            return qs

        user: AnyUser = self.request.user

        if user.is_anonymous or not user.is_active:
            return qs.none()
        if user.is_superuser:
            return qs

        roles = UserRoleChoice.can_manage_reservations()
        if user.permissions.has_general_role(role_choices=roles):
            return qs

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return qs.filter(
            Q(reservation_unit__unit__in=u_ids)  #
            | Q(reservation_unit__unit__unit_groups__in=g_ids)
        ).distinct()

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

        log_text_search(where="reservations", text=value)

        # Shortcut for searching only emails
        if EMAIL_DOMAIN_PATTERN.match(value):
            return qs.filter(Q(user__email__icontains=value) | Q(reservee_email__icontains=value))

        min_search_text_length = 3
        if len(value) >= min_search_text_length:
            fields = (
                "pk",
                "name",
                "reservee_identifier",
                "reservee_email",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_organisation_name",
                "user__email",
                "user__first_name",
                "user__last_name",
                "reservation_series__name",
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
        return qs.order_by(L("reservee_name").order_by(descending=desc))
