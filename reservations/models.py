from django.contrib.auth import get_user_model
from django.db import models
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _

from applications.models import (
    PRIORITIES,
    Application,
    ApplicationEvent,
    ApplicationRound,
)
from reservation_units.models import Purpose, ReservationUnit

Q = models.Q
User = get_user_model()


class AgeGroup(models.Model):

    minimum = models.fields.PositiveIntegerField(
        verbose_name=_("Minimum"), null=False, blank=False
    )

    maximum = models.fields.PositiveIntegerField(
        verbose_name=_("Maximum"), null=True, blank=True
    )

    def __str__(self):
        return "{} - {}".format(self.minimum, self.maximum)


class AbilityGroup(models.Model):

    name = models.fields.TextField(
        verbose_name=_("Name"), null=False, blank=False, unique=True
    )

    def __str__(self):
        return self.name


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

    application_event = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
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


class STATE_CHOISE_CONST(object):
    __slots__ = ()

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


STATE_CHOICES = STATE_CHOISE_CONST()


class ReservationQuerySet(models.QuerySet):
    def total_duration(self):
        return self.annotate(duration=F("end") - F("begin")).aggregate(
            total_duration=Sum("duration")
        )

    def within_application_round_period(self, app_round: ApplicationRound):
        return self.filter(
            begin__gte=app_round.reservation_period_begin,
            end__lte=app_round.reservation_period_end,
        )

    def going_to_occur(self):
        return self.filter(
            state__in=(
                STATE_CHOICES.CREATED,
                STATE_CHOICES.CONFIRMED,
                STATE_CHOICES.REQUESTED,
                STATE_CHOICES.WAITING_FOR_PAYMENT,
            )
        )


class Reservation(models.Model):
    objects = ReservationQuerySet.as_manager()

    state = models.CharField(
        max_length=32,
        choices=STATE_CHOICES.STATE_CHOICES,
        verbose_name=_("State"),
        default=STATE_CHOICES.CREATED,
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
