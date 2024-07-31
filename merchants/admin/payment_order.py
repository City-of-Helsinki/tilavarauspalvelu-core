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
        "remote_id",
        "reservation__name",
        "reservation__reservation_unit__name",
    ]
    search_help_text = _("Search by Payment order ID, Reservation ID or Reservation unit name")

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
    ]

    # Form
    form = PaymentOrderForm

    def reservation_unit(self, obj: PaymentOrder) -> str:
        return obj.reservation.reservation_unit.first() if obj.reservation else ""
