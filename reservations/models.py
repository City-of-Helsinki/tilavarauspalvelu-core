from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext_lazy as _

from applications.models import PRIORITIES, Application
from reservation_units.models import Purpose, ReservationUnit

Q = models.Q


class AgeGroup(models.Model):

    minimum = models.fields.PositiveIntegerField(
        verbose_name=_("Number of persons"), null=False, blank=False
    )

    maximum = models.fields.PositiveIntegerField(
        verbose_name=_("Number of persons"), null=True, blank=True
    )


class AbilityGroup(models.Model):

    name = models.fields.TextField(
        verbose_name=_("Name"), null=False, blank=False, unique=True
    )


class RecurringReservation(models.Model):
    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        on_delete=models.SET_NULL,
        null=True,
    )

    application = models.ForeignKey(
        Application,
        verbose_name=_("Application"),
        related_name="recurring_reservation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    age_group = models.ForeignKey(
        AgeGroup,
        verbose_name=_("Age group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    ability_group = models.ForeignKey(
        AbilityGroup,
        verbose_name=_("Ability group"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
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

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

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

    num_persons = models.fields.PositiveIntegerField(
        verbose_name=_("Number of persons"), null=True, blank=True
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
