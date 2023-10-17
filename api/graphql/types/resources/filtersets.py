import django_filters

from permissions.helpers import can_manage_resources, get_units_with_permission
from spaces.models import Space


class ResourceFilterSet(django_filters.FilterSet):
    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    def get_only_with_permission(self, qs, property, value):
        """Returns resources where the user has resource management permissions"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        elif user.is_superuser or can_manage_resources(user):
            return qs

        units = get_units_with_permission(user, "can_manage_resources")
        spaces = Space.objects.filter(unit__in=units).distinct()
        return qs.filter(space__in=spaces).distinct()
