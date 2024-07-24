from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from merchants.models import PaymentOrder

__all__ = [
    "PaymentOrderAdmin",
]


class PaymentOrderForm(forms.ModelForm):
    class Meta:
        model = PaymentOrder
        fields = [
            "reservation",
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

    def __init__(self, *args, **kwargs) -> None:
        """Add reservation and reservation unit to the reservation field help text."""
        super().__init__(*args, **kwargs)
        payment_order: PaymentOrder | None = kwargs.get("instance", None)
        if payment_order and payment_order.id and payment_order.reservation:
            self.fields["reservation"].help_text += (
                "<br>" + _("Reservation") + f": {payment_order.reservation.id}"
                "<br>" + _("Reservation unit") + f": {payment_order.reservation.reservation_unit.first()}"
            )


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "id__exact",
        "reservation__id__exact",
        "reservation__reservation_unit__name",
    ]
    search_help_text = _("Search by Payment order ID, Reservation ID or Reservation unit name")

    # List
    list_display = [
        "id",
        "reservation_id",
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
    ]

    # Form
    form = PaymentOrderForm

    def reservation_unit(self, obj: PaymentOrder) -> str:
        return obj.reservation.reservation_unit.first() if obj.reservation else ""
