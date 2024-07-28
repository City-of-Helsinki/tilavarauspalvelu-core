from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "Language",
    "OrderStatus",
    "OrderStatusWithFree",
    "PaymentType",
]


class Language(models.TextChoices):
    FI = "fi", _("Finnish")
    SV = "sv", _("Swedish")
    EN = "en", _("English")


class OrderStatus(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")  # Unpaid order
    EXPIRED = "EXPIRED", _("Expired")
    CANCELLED = "CANCELLED", _("Cancelled")
    PAID = "PAID", _("Paid")
    PAID_MANUALLY = "PAID_MANUALLY", _("Paid manually")
    REFUNDED = "REFUNDED", _("Refunded")

    @classmethod
    def needs_update_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]


class OrderStatusWithFree(models.TextChoices):
    """Same as OrderStatus, but includes the 'FREE' option used for filtering reservations without payments."""

    # Note: Enums cannot be subclassed, so we have to redefine all "original" members.
    DRAFT = "DRAFT", _("Draft")
    EXPIRED = "EXPIRED", _("Expired")
    CANCELLED = "CANCELLED", _("Cancelled")
    PAID = "PAID", _("Paid")
    PAID_MANUALLY = "PAID_MANUALLY", _("Paid manually")
    REFUNDED = "REFUNDED", _("Refunded")

    FREE = "FREE", _("Free")


class PaymentType(models.TextChoices):
    ON_SITE = "ON_SITE", _("On site")
    ONLINE = "ONLINE", _("Online")
    INVOICE = "INVOICE", _("Invoice")
