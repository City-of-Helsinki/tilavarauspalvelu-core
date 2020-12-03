import datetime
from typing import Optional

from django.contrib.auth.models import User
from django.db import models
from django.utils import timezone
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from recurrence.fields import RecurrenceField
from rest_framework.exceptions import ValidationError

from reservation_units.models import Purpose, ReservationUnit
from spaces.models import District


def year_not_in_future(year: Optional[int]):
    if year is None:
        return

    current_date = datetime.datetime.now()

    if current_date.year < year:
        msg = _("is after current year")
        raise ValidationError(format_lazy("{year} {msg}", year=year, msg=msg))


class Address(models.Model):
    street_address = models.TextField(
        verbose_name=_("Street address"), null=False, blank=False, max_length=80
    )

    post_code = models.PositiveIntegerField(
        verbose_name=_("Post code"),
        null=False,
        blank=False,
    )

    city = models.TextField(
        verbose_name=_("City"), null=False, blank=False, max_length=80
    )


class Person(models.Model):

    contact_first_name = models.TextField(
        verbose_name=_("First name"), null=True, blank=True, max_length=50
    )

    contact_last_name = models.TextField(
        verbose_name=_("Last name"), null=True, blank=True, max_length=50
    )

    contact_email = models.EmailField(
        verbose_name=_("Email"),
        null=True,
        blank=True,
    )

    contact_phone_number = models.TextField(
        verbose_name=_("Phone number"),
        null=True,
        blank=True,
        max_length=50,
    )

    class Meta:
        abstract = True


class Organisation(models.Model):

    name = models.TextField(
        verbose_name=_("Name"),
        null=False,
        blank=False,
        max_length=255,
    )

    identifier = models.TextField(
        verbose_name=_("Organisation identifier"),
        null=False,
        blank=False,
        max_length=255,
        unique=True,
    )

    year_established = models.PositiveIntegerField(
        verbose_name=_("Year established"),
        validators=[year_not_in_future],
        null=True,
        blank=True,
    )

    address = models.ForeignKey(
        Address, null=True, blank=True, on_delete=models.SET_NULL
    )


class PRIORITY_CONST(object):
    __slots__ = ()

    PRIORITY_LOW = 100
    PRIORITY_MEDIUM = 200
    PRIORITY_HIGH = 300
    PRIORITY_CHOICES = (
        (PRIORITY_LOW, _("Low")),
        (PRIORITY_MEDIUM, _("Medium")),
        (PRIORITY_HIGH, _("High")),
    )


PRIORITIES = PRIORITY_CONST()

class ApplicationPeriod(models.Model):
    name = models.CharField(
        verbose_name=_("Name"),
        max_length=255,
    )
    reservation_units = models.ManyToManyField(
        ReservationUnit,
        verbose_name=_("Reservation units"),
        related_name="application_periods",
    )

    application_period_begin = models.DateField(
        verbose_name=_("Application period begin"),
    )
    application_period_end = models.DateField(
        verbose_name=_("Application period end"),
    )

    reservation_period_begin = models.DateField(
        verbose_name=_("Reservation period begin"),
    )
    reservation_period_end = models.DateField(
        verbose_name=_("Reservation period end"),
    )

    purposes = models.ManyToManyField(
        Purpose,
        verbose_name=_("Purposes"),
        related_name="application_periods",
        blank=True,
    )

    def __str__(self):
        return "{} ({} - {})".format(
            self.name, self.reservation_period_begin, self.reservation_period_end
        )


class Application(Person):

    description = models.fields.TextField(
        verbose_name=_("Description"), max_length=1000, blank=True, null=True
    )

    reservation_purpose = models.ForeignKey(
        to="reservations.ReservationPurpose",
        verbose_name=_("Purpose"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    organisation = models.ForeignKey(
        Organisation,
        verbose_name=_("Organisation"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("Applicant"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )

    application_period = models.ForeignKey(
        ApplicationPeriod,
        verbose_name=_("Applicantion period"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )


class ApplicationEvent(models.Model):

    num_persons = models.PositiveIntegerField(
        verbose_name=_("Number of persons"),
        null=True,
        blank=True,
    )

    age_group = models.ForeignKey(
        verbose_name=_("Age group"),
        to="reservations.AgeGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    ability_group = models.ForeignKey(
        verbose_name=_("Ability group"),
        to="reservations.AbilityGroup",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    num_events = models.PositiveIntegerField(
        verbose_name=_("Number of events"), null=False, blank=False
    )

    duration = models.DurationField(verbose_name=_("Duration"), null=False, blank=False)

    timeframe_start = models.TimeField(
        verbose_name=_("Time frame start"), null=False, blank=False
    )

    timeframe_start = models.TimeField(
        verbose_name=_("Time frame end"), null=False, blank=False
    )

    application = models.ForeignKey(
        Application,
        verbose_name=_("Application"),
        on_delete=models.CASCADE,
        null=False,
        related_name="application_events",
    )

    district = models.ForeignKey(
        District, verbose_name="Area", on_delete=models.SET_NULL, null=True, blank=True
    )

    def clean(self):
        cleaned_data = super().clean()
        start = cleaned_data["timeframe_start"]
        end = cleaned_data["timeframe_end"]

        timeframe_duration: int

        if end < start:
            midnight = timezone.datetime.now().replace(hour=0, minute=0, second=0).time()
            timeframe_duration = abs(midnight - start) + end
        else:
            timeframe_duration = end - start

        if timeframe_duration < cleaned_data["duration"]:
            raise ValidationError("Duration is longer than timeframe")


class ApplicationReservationUnit(models.Model):

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

    units = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
        related_name="units",
        on_delete=models.CASCADE
    )

    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        on_delete=models.PROTECT
    )


class Recurrence(models.Model):
    recurrence = RecurrenceField()

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

    application_event = models.ForeignKey(
        ApplicationEvent,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="recurrences",
    )
