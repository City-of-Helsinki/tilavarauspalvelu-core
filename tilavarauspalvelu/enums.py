from __future__ import annotations

from django.db import models
from django.utils.functional import classproperty
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy

__all__ = [
    "Language",
    "OrderStatus",
    "OrderStatusWithFree",
    "PaymentType",
    "ReservationNotification",
    "ResourceLocationType",
    "ServiceTypeChoices",
    "TermsOfUseTypeChoices",
]


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class ServiceTypeChoices(models.TextChoices):
    INTRODUCTION = "introduction", _("Introduction")
    CATERING = "catering", _("Catering")
    CONFIGURATION = "configuration", _("Configuration")


class TermsOfUseTypeChoices(models.TextChoices):
    GENERIC = "generic_terms", _("Generic terms")
    PAYMENT = "payment_terms", _("Payment terms")
    CANCELLATION = "cancellation_terms", _("Cancellation terms")
    RECURRING = "recurring_terms", _("Recurring reservation terms")
    SERVICE = "service_terms", _("Service-specific terms")
    PRICING = "pricing_terms", _("Pricing terms")


class Language(models.TextChoices):
    FI = "fi", _("Finnish")
    SV = "sv", _("Swedish")
    EN = "en", _("English")


class OrderStatus(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")  # Unpaid order
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    @classproperty
    def needs_update_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
            OrderStatus.CANCELLED,
        ]

    @classproperty
    def can_be_cancelled_statuses(cls) -> list[OrderStatus]:
        return [
            OrderStatus.DRAFT,
            OrderStatus.EXPIRED,
        ]


class OrderStatusWithFree(models.TextChoices):
    """Same as OrderStatus, but includes the 'FREE' option used for filtering reservations without payments."""

    # Note: Enums cannot be subclassed, so we have to redefine all "original" members.
    DRAFT = "DRAFT", pgettext_lazy("OrderStatus", "Draft")
    EXPIRED = "EXPIRED", pgettext_lazy("OrderStatus", "Expired")
    CANCELLED = "CANCELLED", pgettext_lazy("OrderStatus", "Cancelled")
    PAID = "PAID", pgettext_lazy("OrderStatus", "Paid")
    PAID_MANUALLY = "PAID_MANUALLY", pgettext_lazy("OrderStatus", "Paid manually")
    REFUNDED = "REFUNDED", pgettext_lazy("OrderStatus", "Refunded")

    FREE = "FREE", pgettext_lazy("OrderStatus", "Free")


class PaymentType(models.TextChoices):
    ON_SITE = "ON_SITE", pgettext_lazy("PaymentType", "On site")
    ONLINE = "ONLINE", pgettext_lazy("PaymentType", "Online")
    INVOICE = "INVOICE", pgettext_lazy("PaymentType", "Invoice")


class ResourceLocationType(models.TextChoices):
    FIXED = "fixed", pgettext_lazy("ResourceLocationType", "Fixed")
    MOVABLE = "movable", pgettext_lazy("ResourceLocationType", "Movable")
