import django_filters
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservation_units.permissions import (
    ReservationUnitPermission,
)


class ReservationUnitsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationUnitPermission,)

    @classmethod
    def resolve_queryset(cls, connection, iterable, info, args, filtering_args, filterset_class):
        queryset = super().resolve_queryset(connection, iterable, info, args, filtering_args, filterset_class)
        # Hide archived reservation units
        return queryset.filter(is_archived=False)
