import django_filters
from django.db.models import Q
from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservations.permissions import RecurringReservationPermission
from permissions.helpers import get_service_sectors_where_can_view_reservations, get_units_where_can_view_reservations


class RecurringReservationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (RecurringReservationPermission,)

    @classmethod
    def resolve_queryset(cls, connection, iterable, info, args, filtering_args, filterset_class):
        queryset = super().resolve_queryset(connection, iterable, info, args, filtering_args, filterset_class)
        user = info.context.user
        viewable_units = get_units_where_can_view_reservations(user)
        viewable_service_sectors = get_service_sectors_where_can_view_reservations(user)
        if user.is_anonymous:
            return queryset.none()
        queryset = queryset.filter(
            Q(reservation_unit__unit__in=viewable_units)
            | Q(reservation_unit__unit__service_sectors__in=viewable_service_sectors)
            | Q(user=user)
        ).distinct()

        if not args.get("order_by", None):
            queryset = queryset.order_by("begin_date", "begin_time", "reservation_unit")
        return queryset
