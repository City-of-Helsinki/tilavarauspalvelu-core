import django_filters
from django.db.models import Q

from permissions.helpers import can_manage_spaces, get_units_with_permission


class SpaceFilterSet(django_filters.FilterSet):
    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    def get_only_with_permission(self, qs, property, value):
        """Returns spaces where the user has space management permissions"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        elif user.is_superuser or can_manage_spaces(user):
            return qs

        units = get_units_with_permission(user, "can_manage_spaces")
        return qs.filter(Q(unit__in=units)).distinct()
