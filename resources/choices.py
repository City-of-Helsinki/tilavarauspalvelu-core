from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ResourceLocationType",
]


class ResourceLocationType(models.TextChoices):
    FIXED = "fixed", _("Fixed")
    MOVABLE = "movable", _("Movable")
