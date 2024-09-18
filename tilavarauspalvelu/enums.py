from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationNotification",
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
