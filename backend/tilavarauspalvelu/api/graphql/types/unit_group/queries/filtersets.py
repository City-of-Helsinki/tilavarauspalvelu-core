from django.db import models
from django.db.models import Q
from undine import Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import UnitGroup, User

__all__ = [
    "UnitGroupFilterSet",
]


class UnitGroupFilterSet(FilterSet[UnitGroup]):
    pk = Filter(lookup="in")

    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_en_exact = Filter("name_sv", lookup="iexact")
    name_sv_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_en_contains = Filter("name_sv", lookup="icontains")
    name_sv_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_en_startswith = Filter("name_sv", lookup="istartswith")
    name_sv_startswith = Filter("name_en", lookup="istartswith")

    @Filter
    def application_round(self, info: GQLInfo[User], *, value: int) -> models.Q:
        return models.Q(units__reservation_units__application_rounds=value)

    @Filter(distinct=True)
    def only_with_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """
        Returns UnitGroups that the user has direct permission to and UnitGroups
        that contain at least one unit that the user has permission to.
        """
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

        g_ids = list(user.active_unit_group_roles)
        u_ids = list(user.active_unit_roles)

        return Q(id__in=g_ids) | Q(units__id__in=u_ids)
