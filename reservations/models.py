from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User

from spaces.models import Space
from resources.models import FixedResource, MovableResource
from services.models import Service

Q = models.Q


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    spaces = models.ManyToManyField(
        Space, verbose_name=_("Spaces"), related_name="reservation_units", blank=True
    )
    fixed_resources = models.ManyToManyField(
        FixedResource,
        verbose_name=_("Fixed resources"),
        related_name="reservation_units",
        blank=True,
    )
    movable_resources = models.ManyToManyField(
        MovableResource,
        verbose_name=_("Movable resources"),
        related_name="reservation_units",
        blank=True,
    )
    services = models.ManyToManyField(
        Service,
        verbose_name=_("Services"),
        related_name="reservation_units",
        blank=True,
    )

    require_introduction = models.BooleanField(
        verbose_name=_("Require introduction"), default=False
    )

    def __str__(self):
        return "{}".format(self.name)

    def check_required_introduction(self, user):
        return Introduction.objects.filter(reservation_unit=self, user=user).exists()

    def check_reservation_overlap(self, start_time, end_time):
        reservation_units_with_same_components = ReservationUnit.objects.filter(
            Q(fixed_resources__in=self.fixed_resources.all())
            | Q(spaces__in=self.spaces.all())
            | Q(movable_resources__in=self.movable_resources.all())
        )

        return Reservation.objects.filter(
            reservation_unit__in=reservation_units_with_same_components,
            end__gt=start_time,
            begin__lt=end_time,
        ).exists()


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

    buffer_time_before = models.DurationField(
        verbose_name=_("Buffer time before"), blank=True, null=True
    )
    buffer_time_after = models.DurationField(
        verbose_name=_("Buffer time after"), blank=True, null=True
    )

    reservation_unit = models.ForeignKey(
        ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.CASCADE
    )
