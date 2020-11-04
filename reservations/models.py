from django.db import models
from django.utils.translation import ugettext_lazy as _
from django.contrib.auth.models import User

from spaces.models import Space
from resources.models import Resource
from services.models import Service
from reservation_units.models import ReservationUnit, Purpose

Q = models.Q


class RecurringReservation(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )


class Reservation(models.Model):
    CREATED = "created"
    CANCELLED = "cancelled"
    CONFIRMED = "confirmed"
    DENIED = "denied"
    REQUESTED = "requested"
    WAITING_FOR_PAYMENT = "waiting_for_payment"

    STATE_CHOICES = (
        (CREATED, _("created")),
        (CANCELLED, _("cancelled")),
        (CONFIRMED, _("confirmed")),
        (DENIED, _("denied")),
        (REQUESTED, _("requested")),
        (WAITING_FOR_PAYMENT, _("waiting for payment")),
    )

    state = models.CharField(
        max_length=32, choices=STATE_CHOICES, verbose_name=_("State"), default=CREATED
    )

    PRIORITY_LOW = 100
    PRIORITY_MEDIUM = 200
    PRIORITY_HIGH = 300

    PRIORITY_CHOICES = (
        (PRIORITY_LOW, _("Low")),
        (PRIORITY_MEDIUM, _("Medium")),
        (PRIORITY_HIGH, _("High")),
    )

    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=PRIORITY_MEDIUM)

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

    reservation_unit = models.ManyToManyField(
        ReservationUnit, verbose_name=_("Reservation unit")
    )

    recurring_reservation = models.ForeignKey(
        RecurringReservation,
        verbose_name=_("Recurring reservation"),
        related_name="reservations",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )


class ReservationPurpose(models.Model):
    reservation = models.OneToOneField(
        Reservation, verbose_name=_("Reservation"), on_delete=models.CASCADE
    )
    purpose = models.ForeignKey(
        Purpose,
        verbose_name=_("Reservation purpose"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    custom_purpose = models.TextField(verbose_name=_("Custom purpose"), blank=True)
