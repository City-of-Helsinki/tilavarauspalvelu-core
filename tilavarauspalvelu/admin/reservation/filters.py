from django.contrib import admin
from django.db.models import QuerySet
from django.utils.translation import gettext_lazy as _

from common.typing import WSGIRequest
from tilavarauspalvelu.models import Reservation


class RecurringReservationListFilter(admin.SimpleListFilter):
    title = _("Recurring reservation")
    parameter_name = "recurring_reservation"

    def lookups(self, request: WSGIRequest, model_admin: admin.ModelAdmin) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]):
        if self.value() == "1":
            return queryset.filter(recurring_reservation__isnull=False)
        if self.value() == "0":
            return queryset.filter(recurring_reservation__isnull=True)
        return queryset


class PaidReservationListFilter(admin.SimpleListFilter):
    title = _("Paid reservation")
    parameter_name = "paid_reservation"

    def lookups(self, request: WSGIRequest, model_admin: admin.ModelAdmin) -> list[tuple[str, str]]:
        return [
            ("1", _("Yes")),
            ("0", _("No")),
        ]

    def queryset(self, request: WSGIRequest, queryset: QuerySet[Reservation]):
        if self.value() == "1":
            return queryset.filter(price__gt=0)
        if self.value() == "0":
            return queryset.filter(price=0)
        return queryset
