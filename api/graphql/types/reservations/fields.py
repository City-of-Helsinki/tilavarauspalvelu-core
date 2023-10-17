import django_filters
from graphene_permissions.mixins import AuthFilter
from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.types.reservations.permissions import (
    AgeGroupPermission,
    ReservationMetadataSetPermission,
    ReservationPermission,
    ReservationPurposePermission,
)


class ReservationsFilter(AuthFilter, django_filters.FilterSet):
    permission_classes = (ReservationPermission,)

    @classmethod
    def resolve_queryset(cls, connection, iterable, info, args, filtering_args, filterset_class):
        queryset = super().resolve_queryset(connection, iterable, info, args, filtering_args, filterset_class)

        if not args.get("order_by", None):
            queryset = queryset.order_by("begin")
        return queryset


class ReservationPurposeFilter(AuthFilter):
    permission_classes = (ReservationPurposePermission,)


class ReservationCancelReasonFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class ReservationDenyReasonFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class AgeGroupFilter(AuthFilter):
    permission_classes = (AgeGroupPermission,)


class ReservationMetadataSetFilter(AuthFilter):
    permission_classes = (ReservationMetadataSetPermission,)
