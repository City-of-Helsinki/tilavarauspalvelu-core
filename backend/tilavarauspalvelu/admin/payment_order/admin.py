from __future__ import annotations

import uuid
from typing import TYPE_CHECKING, Any

from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from rangefilter.filters import DateRangeFilterBuilder

from tilavarauspalvelu.models import PaymentOrder, ReservationUnit

if TYPE_CHECKING:
    from django.db import models
    from django.db.models import QuerySet

    from tilavarauspalvelu.models.payment_order.queryset import PaymentOrderQuerySet
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "PaymentOrderAdmin",
]


class PaymentOrderForm(forms.ModelForm):
    class Meta:
        model = PaymentOrder
        fields = []  # Use fields from ModelAdmin
        labels = {
            "reservation": _("Reservation"),
            "remote_id": _("Remote order ID"),
            "payment_id": _("Payment ID"),
            "refund_id": _("Refund ID"),
            "payment_type": _("Payment type"),
            "status": _("Payment status"),
            "price_net": _("Net amount"),
            "price_vat": _("VAT amount"),
            "price_total": _("Total amount"),
            "processed_at": _("Processed at"),
            "language": _("Language"),
            "reservation_user_uuid": _("Reservation user UUID"),
            "checkout_url": _("Checkout URL"),
            "receipt_url": _("Receipt URL"),
        }
        help_texts = {
            "reservation": _("The reservation associated with this payment order"),
            "remote_id": _("eCommerce order ID"),
            "payment_id": _("eCommerce payment ID"),
            "refund_id": _("Available only when order has been refunded"),
        }


class ReservationUnitFilter(admin.SimpleListFilter):
    title = _("reservation unit")
    parameter_name = "reservation_unit"

    def lookups(self, *args: Any) -> list[tuple[int, str]]:
        return (
            ReservationUnit.objects.filter(pricings__lowest_price__gt=0)
            .distinct()
            .order_by("unit__name", "name")
            .values_list("id", "name")
        )

    def queryset(self, request: WSGIRequest, queryset: PaymentOrderQuerySet) -> QuerySet:
        value: str | None = self.value()
        if value is None:
            return queryset
        return queryset.filter(reservation__reservation_units__pk=value).distinct()


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        # 'id' handled separately in `get_search_results()`
        # 'reservation_id' handled separately in `get_search_results()`
        # 'remote_id' handled separately in `get_search_results()`
        "reservation__name",
        "reservation__reservation_units__name",
    ]
    search_help_text = _(
        "Search by Payment Order ID, Reservation ID, Remote Order ID, Reservation name, or Reservation Unit name"
    )

    # List
    list_display = [
        "id",
        "reservation_id",
        "remote_id",
        "status",
        "price_total",
        "price_net",
        "payment_type",
        "processed_at",
        "reservation_unit",
    ]
    list_filter = [
        "status",
        "payment_type",
        ("processed_at", DateRangeFilterBuilder(title=_("processed at"))),
        ReservationUnitFilter,
    ]

    # Form
    form = PaymentOrderForm
    fields = [
        "reservation",
        "reservation_unit",
        "remote_id",
        "payment_id",
        "refund_id",
        "payment_type",
        "status",
        "price_net",
        "price_vat",
        "price_total",
        "processed_at",
        "language",
        "reservation_user_uuid",
        "checkout_url",
        "receipt_url",
    ]
    readonly_fields = [
        "reservation",
        "reservation_unit",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("reservation")

    def reservation_unit(self, obj: PaymentOrder) -> str:
        return obj.reservation.reservation_units.first() if obj.reservation else ""

    def get_search_results(
        self,
        request: WSGIRequest,
        queryset: models.QuerySet,
        search_term: Any,
    ) -> tuple[models.QuerySet, bool]:
        queryset, may_have_duplicates = super().get_search_results(request, queryset, search_term)

        if str(search_term).isdigit():
            queryset |= self.model.objects.filter(id__exact=int(search_term))
            queryset |= self.model.objects.filter(reservation__id__exact=int(search_term))

        try:
            term = uuid.UUID(search_term)
        except ValueError:
            pass
        else:
            queryset |= self.model.objects.filter(remote_id=term)

        return queryset, may_have_duplicates
