from django.db import models
from django.utils.translation import gettext_lazy as _

from spaces.models import Space


class Resource(models.Model):
    LOCATION_FIXED = "fixed"
    LOCATION_MOVABLE = "movable"

    LOCATION_TYPES = ((LOCATION_FIXED, _("Fixed")), (LOCATION_MOVABLE, _("Movable")))
    location_type = models.CharField(
        max_length=20, choices=LOCATION_TYPES, default=LOCATION_FIXED
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(
        verbose_name=_("Description for the resource"), default=""
    )
    space = models.ForeignKey(
        Space, verbose_name="Space", on_delete=models.SET_NULL, null=True, blank=True
    )
    buffer_time_before = models.DurationField(
        verbose_name=_("Buffer time before"), blank=True, null=True
    )
    buffer_time_after = models.DurationField(
        verbose_name=_("Buffer time after"), blank=True, null=True
    )

    is_draft = models.BooleanField(
        verbose_name=_("Is the resource in draft state (=not publish ready)."),
        default=False,
        db_index=True,
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.space.name if self.space else "")
