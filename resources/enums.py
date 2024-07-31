from django.db import models
from django.utils.translation import pgettext_lazy

__all__ = [
    "ResourceLocationType",
]


class ResourceLocationType(models.TextChoices):
    FIXED = "fixed", pgettext_lazy("ResourceLocationType", "Fixed")
    MOVABLE = "movable", pgettext_lazy("ResourceLocationType", "Movable")
