import datetime

import django_filters
from django.db.models import Count, Q
from django.utils.timezone import get_default_timezone

from api.graphql.types.units.types import Unit


class UnitsFilterSet(django_filters.FilterSet):
    pk = django_filters.ModelMultipleChoiceFilter(field_name="pk", method="filter_by_pk", queryset=Unit.objects.all())

    name_fi = django_filters.CharFilter(field_name="name_fi", lookup_expr="istartswith")
    name_en = django_filters.CharFilter(field_name="name_en", lookup_expr="istartswith")
    name_sv = django_filters.CharFilter(field_name="name_sv", lookup_expr="istartswith")
    service_sector = django_filters.NumberFilter(field_name="service_sectors__pk")

    only_with_permission = django_filters.BooleanFilter(method="get_only_with_permission")

    published_reservation_units = django_filters.BooleanFilter(method="get_published_reservation_units")

    own_reservations = django_filters.BooleanFilter(method="get_own_reservations")

    order_by = django_filters.OrderingFilter(fields=("name_fi", "name_en", "name_sv", "rank", "reservation_count"))

    def filter_queryset(self, queryset):
        queryset = queryset.annotate(reservation_count=Count("reservationunit__reservation"))

        return super().filter_queryset(queryset)

    def filter_by_pk(self, qs, property, value):
        if value:
            return qs.filter(id__in=[model.id for model in value])

        return qs

    def get_only_with_permission(self, qs, property, value):
        """Returns units where the user has any kind of permissions"""
        if not value:
            return qs

        user = self.request.user

        if user.is_anonymous:
            return qs.none()
        elif user.is_superuser or user.general_roles.exists():
            return qs

        return qs.filter(
            Q(id__in=user.unit_roles.values_list("unit", flat=True))
            | Q(unit_groups__in=user.unit_roles.values_list("unit_group", flat=True))
            | Q(
                id__in=Unit.objects.filter(
                    service_sectors__in=user.service_sector_roles.values_list("service_sector", flat=True)
                )
            )
        ).distinct()

    def get_published_reservation_units(self, qs, property, value):
        now = datetime.datetime.now(tz=get_default_timezone())

        if value:
            query = (
                Q(reservationunit__is_archived=False)
                & Q(reservationunit__is_draft=False)
                & (Q(reservationunit__publish_begins__isnull=True) | Q(reservationunit__publish_begins__lte=now))
                & (Q(reservationunit__publish_ends__isnull=True) | Q(reservationunit__publish_ends__gt=now))
                & (
                    Q(reservationunit__reservation_begins__isnull=True)
                    | Q(reservationunit__reservation_begins__lte=now)
                )
                & (Q(reservationunit__reservation_ends__isnull=True) | Q(reservationunit__reservation_ends__gt=now))
            )

        else:
            query = (
                Q(reservationunit__is_archived=True)
                | Q(reservationunit__is_draft=True)
                | (Q(reservationunit__publish_begins__gte=now))
                | (Q(reservationunit__publish_ends__lt=now))
                | (Q(reservationunit__reservation_begins__lte=now))
                | (Q(reservationunit__reservation_ends__gt=now))
            )

        return qs.filter(query)

    def get_own_reservations(self, qs, property, value):
        user = self.request.user

        if user.is_anonymous:
            return qs.none()

        units_with_reservations = Q(reservationunit__reservation__user=user)

        if value:
            return qs.filter(units_with_reservations)

        return qs.exclude(units_with_reservations)
