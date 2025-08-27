from django.db import models
from django.db.models import Q
from undine import Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import ReservationKind, UserRoleChoice
from tilavarauspalvelu.models import Unit, User
from utils.date_utils import local_datetime

__all__ = [
    "UnitFilterSet",
]


class UnitFilterSet(FilterSet[Unit]):
    pk = Filter(lookup="in")
    unit_group = Filter("unit_groups", lookup="in")

    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_en_exact = Filter("name_sv", lookup="iexact")
    name_sv_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_en_contains = Filter("name_sv", lookup="icontains")
    name_sv_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_en_startswith = Filter("name_sv", lookup="istartswith")
    name_sv_startswith = Filter("name_en", lookup="istartswith")

    @Filter(distinct=True)
    def only_with_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        if not value:
            return models.Q()

        user = info.context.user
        if user.is_anonymous:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        # All roles except the notification manager work with units.
        role_choices = set(UserRoleChoice) - {UserRoleChoice.NOTIFICATION_MANAGER}
        if user.permissions.has_general_role(role_choices=role_choices):
            return models.Q()

        u_ids = list(user.active_unit_roles)
        g_ids = list(user.active_unit_group_roles)

        return Q(id__in=u_ids) | Q(unit_groups__in=g_ids)

    @Filter(distinct=True)
    def own_reservations(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        user = info.context.user
        if user.is_anonymous:
            raise EmptyFilterResult

        return Q(reservation_units__reservations__user=user, _negated=not value)

    @Filter(distinct=True)
    def published_reservation_units(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        now = local_datetime()

        if not value:
            return (
                Q(reservation_units__is_archived=True)
                | Q(reservation_units__is_draft=True)
                | Q(reservation_units__publish_begins_at__gte=now)
                | Q(reservation_units__publish_ends_at__lt=now)
            )

        return (
            Q(reservation_units__is_archived=False)
            & Q(reservation_units__is_draft=False)
            & (Q(reservation_units__publish_begins_at__isnull=True) | Q(reservation_units__publish_begins_at__lte=now))
            & (Q(reservation_units__publish_ends_at__isnull=True) | Q(reservation_units__publish_ends_at__gt=now))
        )

    @Filter(distinct=True)
    def only_direct_bookable(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        if not value:
            return models.Q()

        return models.Q(reservation_units__reservation_kind__in=ReservationKind.allows_direct)

    @Filter(distinct=True)
    def only_seasonal_bookable(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        if not value:
            return models.Q()

        return models.Q(reservation_units__reservation_kind__in=ReservationKind.allows_season)
