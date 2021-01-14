import datetime
from typing import Optional

from django.contrib.auth.models import User
from django.db import models
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from recurrence.fields import RecurrenceField
from rest_framework.exceptions import ValidationError

from applications.base_models import ContactInformation
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


class Person(ContactInformation):
    REQUIRED_FOR_REVIEW = ["first_name", "last_name"]

    first_name = models.TextField(
        verbose_name=_("First name"), null=False, blank=True, max_length=50
    )

    last_name = models.TextField(
        verbose_name=_("Last name"), null=False, blank=True, max_length=50
    )


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
        unique=False,
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

    application_period_begin = models.DateTimeField(
        verbose_name=_("Application period begin"),
    )
    application_period_end = models.DateTimeField(
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


class ApplicationStatus(models.Model):
    DRAFT = "draft"
    REVIEW = "review"
    FINISHED = "finished"

    STATUS_CHOICES = (
        (DRAFT, _("Draft")),
        (REVIEW, _("Review")),
        (FINISHED, _("Finished")),
    )

    status = models.CharField(
        max_length=20, verbose_name=_("Status"), choices=STATUS_CHOICES
    )

    application = models.ForeignKey(
        "Application",
        verbose_name=_("Application"),
        on_delete=models.CASCADE,
        null=False,
        related_name="statuses",
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    timestamp = models.DateTimeField(verbose_name=_("Timestamp"), auto_now_add=True)

    def __str__(self):
        return "{} ({})".format(self.get_status_display(), self.application.id)


class Application(models.Model):
    organisation = models.ForeignKey(
        Organisation,
        verbose_name=_("Organisation"),
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    contact_person = models.ForeignKey(
        Person,
        verbose_name=_("Contact person"),
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("Applicant"),
        null=True,
        blank=True,
        on_delete=models.PROTECT,
    )

    application_period = models.ForeignKey(
        ApplicationPeriod,
        verbose_name=_("Applicantion period"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )

    @property
    def status(self):
        return self.get_status().status

    @status.setter
    def status(self, status):
        self.set_status(status)

    @status.getter
    def status(self):
        return self.get_status().status

    def set_status(self, status, user=None):
        if status not in [
            ApplicationStatus.DRAFT,
            ApplicationStatus.REVIEW,
            ApplicationStatus.FINISHED,
        ]:
            raise ValidationError(_("Invalid status"))
        ApplicationStatus.objects.create(application=self, status=status, user=user)

    def get_status(self):
        return self.statuses.last()

    def validate_review(self):
        if not hasattr(self, "contact_person"):
            raise ValidationError(_("Application must have contact person"))


class ApplicationEvent(models.Model):
    REQUIRED_FOR_REVIEW = [
        "num_persons",
        "age_group",
        "min_duration",
        "events_per_week",
        "biweekly",
        "begin",
        "end",
    ]

    name = models.TextField(
        max_length=100,
        verbose_name=_("Name"),
        null=False,
        blank=True,
    )

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

    min_duration = models.DurationField(
        verbose_name=_("Minimum duration"), null=True, blank=True
    )

    max_duration = models.DurationField(
        verbose_name=_("Maximum duration"), null=True, blank=True
    )

    events_per_week = models.PositiveIntegerField(
        verbose_name=_("Events per week"), null=True, blank=True
    )

    biweekly = models.BooleanField(
        verbose_name=_("Every second week only"), default=False, null=False, blank=True
    )

    begin = models.DateField(verbose_name=_("Start date"), null=True, blank=True)

    end = models.DateField(verbose_name=_("End date"), null=True, blank=True)

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

    purpose = models.ForeignKey(
        Purpose,
        verbose_name=_("Purpose"),
        on_delete=models.PROTECT,
        null=True,
        blank=False,
    )


class EventReservationUnit(models.Model):

    priority = models.IntegerField(
        verbose_name=_("Priority"),
        null=True,
        blank=True,
    )

    application_event = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
        related_name="event_reservation_units",
        on_delete=models.CASCADE,
    )

    reservation_unit = models.ForeignKey(
        ReservationUnit, verbose_name=_("Reservation unit"), on_delete=models.PROTECT
    )


class ApplicationEventSchedule(models.Model):

    DATE_CHOISES = (
        (0, _("Monday")),
        (1, _("Tuesday")),
        (2, _("Wednesday")),
        (3, _("Thursday")),
        (4, _("Friday")),
        (5, _("Saturday")),
        (6, _("Sunday")),
    )
    day = models.IntegerField(verbose_name=_("Day"), choices=DATE_CHOISES, null=False)

    begin = models.TimeField(
        verbose_name=_("Start"),
        null=False,
        blank=False,
    )

    end = models.TimeField(
        verbose_name=_("End"),
        null=False,
        blank=False,
    )

    priority = models.IntegerField(
        choices=PRIORITIES.PRIORITY_CHOICES, default=PRIORITIES.PRIORITY_MEDIUM
    )

    application_event = models.ForeignKey(
        ApplicationEvent,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="application_event_schedules",
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
