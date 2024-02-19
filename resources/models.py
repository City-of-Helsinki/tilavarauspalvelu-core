from django.db import models
from django.utils.translation import gettext_lazy as _

from resources.choices import ResourceLocationType
from spaces.models import Space

__all__ = [
    "Resource",
]


class Resource(models.Model):
    location_type = models.CharField(
        max_length=20,
        choices=ResourceLocationType.choices,
        default=ResourceLocationType.FIXED.value,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    space = models.ForeignKey(Space, verbose_name="Space", on_delete=models.SET_NULL, null=True, blank=True)
    buffer_time_before = models.DurationField(verbose_name=_("Buffer time before"), blank=True, null=True)
    buffer_time_after = models.DurationField(verbose_name=_("Buffer time after"), blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "resource"
        base_manager_name = "objects"

    def __str__(self) -> str:
        value = self.name
        if self.space is not None:
            value += f" ({self.space!s})"
        return value
