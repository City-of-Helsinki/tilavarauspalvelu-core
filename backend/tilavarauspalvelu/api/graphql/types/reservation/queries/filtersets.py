import datetime
import re

from django.contrib.postgres.search import SearchQuery, SearchVector
from django.db import models
from undine import DjangoExpression, Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import OrderStatusWithFree, ReservationStateChoice, UserRoleChoice
from tilavarauspalvelu.models import Reservation, User
from utils.date_utils import local_end_of_day, local_start_of_day
from utils.db import build_search

EMAIL_DOMAIN_PATTERN = re.compile(r"^@\w[.\w]{0,254}$")
"""
Matches email domains like:
- @email.com
- @email.co.uk
- @localhost
"""


class ReservationFilterSet(FilterSet[Reservation]):
    pk = Filter(lookup="in")
    ext_uuid = Filter()

    reservation_type = Filter("type", lookup="in")
    reservation_unit_type = Filter("reservation_unit__reservation_unit_type", lookup="in")

    applying_for_free_of_charge = Filter()
    state = Filter(lookup="in")

    price_gte = Filter("price", lookup="gte")
    price_lte = Filter("price", lookup="lte")

    reservation_unit = Filter(lookup="in")
    unit = Filter("reservation_unit__unit", lookup="in")
    reservation_series = Filter(lookup="in")
    user = Filter(lookup="in")

    @Filter
    def begin_date(self, info: GQLInfo[User], value: datetime.date) -> models.Q:
        return models.Q(ends_at__gte=local_start_of_day(value))

    @Filter
    def end_date(self, info: GQLInfo[User], value: datetime.date) -> models.Q:
        return models.Q(begins_at__lte=local_end_of_day(value))

    @Filter
    def created_after(self, info: GQLInfo[User], value: datetime.date) -> models.Q:
        return models.Q(created_at__gte=local_start_of_day(value))

    @Filter
    def created_before(self, info: GQLInfo[User], value: datetime.date) -> models.Q:
        return models.Q(created_at__lte=local_end_of_day(value))

    @Filter
    def requested(self, info: GQLInfo[User], value: bool) -> models.Q:
        """Filter for displaying reservations which requires or had required handling."""
        q = models.Q(state=ReservationStateChoice.REQUIRES_HANDLING) | models.Q(handled_at__isnull=False)
        return q if value else ~q

    @Filter
    def is_recurring(self, info: GQLInfo[User], value: bool) -> models.Q:
        return models.Q(reservation_series__isnull=not value)

    @Filter
    def reservation_unit_name_fi(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_fi__istartswith=word)
        return q

    @Filter
    def reservation_unit_name_en(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_en__istartswith=word)
        return q

    @Filter
    def reservation_unit_name_sv(self, info: GQLInfo[User], value: str) -> models.Q:
        q = models.Q()
        for word in value.split(","):
            word = word.strip()
            if word:
                q |= models.Q(reservation_unit__name_sv__istartswith=word)
        return q

    @Filter
    def order_status(self, info: GQLInfo[User], value: list[OrderStatusWithFree]) -> models.Q:
        q = models.Q(payment_order__status__in=value)
        if OrderStatusWithFree.FREE in value:
            q |= models.Q(payment_order__isnull=True)
        return q

    @Filter(distinct=True)
    def only_with_permission(self, info: GQLInfo[User], value: bool) -> models.Q:
        if not value:
            return models.Q()

        user: User = info.context.user
        if user.is_anonymous or not user.is_active:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        roles = UserRoleChoice.can_view_reservations()
        reserver_roles = UserRoleChoice.can_create_staff_reservations()

        if user.permissions.has_general_role(role_choices=roles):
            return models.Q()

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        reserver_u_ids = user.permissions.unit_ids_where_has_role(role_choices=reserver_roles)
        reserver_g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=reserver_roles)

        return (
            # Either has "can_view_reservations" permissions
            models.Q(reservation_unit__unit__in=u_ids)  #
            | models.Q(reservation_unit__unit__unit_groups__in=g_ids)
            # ...or is the owner of the reservation, and has "can_create_staff_reservations" permissions to it
            | (
                models.Q(user=user)
                & (
                    models.Q(reservation_unit__unit__in=reserver_u_ids)  #
                    | models.Q(reservation_unit__unit__unit_groups__in=reserver_g_ids)
                )
            )
        )

    @Filter(distinct=True)
    def only_with_handling_permission(self, info: GQLInfo[User], value: bool) -> models.Q:
        if not value:
            return models.Q()

        user: User = info.context.user
        if user.is_anonymous or not user.is_active:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        roles = UserRoleChoice.can_manage_reservations()
        if user.permissions.has_general_role(role_choices=roles):
            return models.Q()

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return models.Q(reservation_unit__unit__in=u_ids) | models.Q(reservation_unit__unit__unit_groups__in=g_ids)

    @Filter
    def text_search(self, info: GQLInfo[User], value: str) -> models.Q:
        value = value.strip()
        if not value:
            return models.Q()

        # Shortcut for searching only emails
        if EMAIL_DOMAIN_PATTERN.match(value):
            return models.Q(user__email__icontains=value) | models.Q(reservee_email__icontains=value)

        min_search_text_length = 3
        if len(value) >= min_search_text_length:
            search = build_search(value)
            return models.Q(ts_vector=SearchQuery(value=search, config="finnish", search_type="raw"))

        if value.isnumeric():
            return models.Q(pk=int(value))

        return models.Q()

    @text_search.aliases
    def text_search_aliases(self, info: GQLInfo[User], *, value: str) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "ts_vector": SearchVector(
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
                config="finnish",
            ),
        }
