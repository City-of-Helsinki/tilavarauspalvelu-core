from django.db import models
from django.utils.translation import ugettext_lazy as _

from spaces.models import Space
from resources.models import FixedResource, MovableResource
from services.models import Service
from django.contrib.auth.models import User


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    spaces = models.ManyToManyField(
        Space, verbose_name=_("Spaces"), related_name="reservation_units"
    )
    fixed_resources = models.ManyToManyField(
        FixedResource,
        verbose_name=_("Fixed resources"),
        related_name="reservation_units",
    )
    movable_resources = models.ManyToManyField(
        MovableResource,
        verbose_name=_("Movable resources"),
        related_name="reservation_units",
    )
    services = models.ManyToManyField(
        Service, verbose_name=_("Services"), related_name="reservation_units"
    )

    require_introduction = models.BooleanField(
        verbose_name=_("Require introduction"), default=False
    )


class Introduction(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    reservation_unit = models.ForeignKey(
        ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.CASCADE
    )

    completed_at = models.DateTimeField(verbose_name=_("Completed at"))


class Reservation(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )
    begin = models.DateTimeField(verbose_name=_("Begin time"))
    end = models.DateTimeField(verbose_name=_("End time"))
    reservation_unit = models.ForeignKey(
        ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.CASCADE
    )
