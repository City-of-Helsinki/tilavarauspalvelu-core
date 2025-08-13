from django.db import models
from undine import Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import Resource, Space, User

__all__ = [
    "ResourceFilterSet",
]


class ResourceFilterSet(FilterSet[Resource]):
    pk = Filter(lookup="in")

    name_fi_exact = Filter("name_fi", lookup="iexact")
    name_sv_exact = Filter("name_sv", lookup="iexact")
    name_en_exact = Filter("name_en", lookup="iexact")

    name_fi_contains = Filter("name_fi", lookup="icontains")
    name_sv_contains = Filter("name_sv", lookup="icontains")
    name_en_contains = Filter("name_en", lookup="icontains")

    name_fi_startswith = Filter("name_fi", lookup="istartswith")
    name_sv_startswith = Filter("name_sv", lookup="istartswith")
    name_en_startswith = Filter("name_en", lookup="istartswith")

    @Filter
    def only_with_permission(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        """Returns resources where the user has resource management permissions"""
        if not value:
            return models.Q()

        user = info.context.user

        if user.is_anonymous or not user.is_active:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        roles = UserRoleChoice.can_manage_reservation_units()
        if user.permissions.has_general_role(role_choices=roles):
            return models.Q()

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        qs = Space.objects.filter(models.Q(unit__in=u_ids) | models.Q(unit__unit_groups__in=g_ids))

        return models.Q(space__in=models.Subquery(queryset=qs.values("id")))
