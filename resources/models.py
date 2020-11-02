from django.db import models
from django.utils.translation import ugettext_lazy as _
from spaces.models import Space


class FixedResource(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    space = models.ForeignKey(
        Space, verbose_name="Space", on_delete=models.SET_NULL, null=True, blank=True
    )
    buffer_time_before = models.DurationField(
        verbose_name=_("Buffer time before"), blank=True, null=True
    )
    buffer_time_after = models.DurationField(
        verbose_name=_("Buffer time after"), blank=True, null=True
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.space.name if self.space else "")


class MovableResource(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    buffer_time_before = models.DurationField(
        verbose_name=_("Buffer time before"), blank=True, null=True
    )
    buffer_time_after = models.DurationField(
        verbose_name=_("Buffer time after"), blank=True, null=True
    )

    def __str__(self):
        return "{}".format(self.name)
