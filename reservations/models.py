from django.db import models
from django.utils.translation import ugettext_lazy as _


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_('Name'), max_length=255)


class Reservation(models.Model):
    begin = models.DateTimeField(verbose_name=_('Begin time'))
    end = models.DateTimeField(verbose_name=_('End time'))
    reservation_unit = models.ForeignKey(ReservationUnit)
