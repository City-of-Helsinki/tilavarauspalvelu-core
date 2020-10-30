from django.db import models
from django.utils.translation import ugettext_lazy as _
from spaces.models import Space


class FixedResource(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    space = models.ForeignKey(
        Space, verbose_name="Space", on_delete=models.SET_NULL, null=True, blank=True
    )


class MovableResource(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
