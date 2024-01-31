import django_filters
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservations.permissions import (
    ReservationPermission,
)


class ReservationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationPermission,)

    @classmethod
    def resolve_queryset(cls, connection, iterable, info, args, filtering_args, filterset_class):
        queryset = super().resolve_queryset(connection, iterable, info, args, filtering_args, filterset_class)

        if not args.get("order_by", None):
            queryset = queryset.order_by("begin")
        return queryset
