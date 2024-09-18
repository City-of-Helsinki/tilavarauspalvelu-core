from __future__ import annotations

from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationNotification",
    "ServiceTypeChoices",
]


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class ServiceTypeChoices(models.TextChoices):
    INTRODUCTION = "introduction", _("Introduction")
    CATERING = "catering", _("Catering")
    CONFIGURATION = "configuration", _("Configuration")
