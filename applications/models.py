import datetime
from typing import Optional

import recurrence
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from recurrence.fields import RecurrenceField
from rest_framework.exceptions import ValidationError

from applications.base_models import ContactInformation
from reservation_units.models import Purpose, ReservationUnit
from spaces.models import District
from tilavarauspalvelu.utils.date_util import (
    next_or_current_matching_weekday,
    previous_or_current_matching_weekday,
)


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

    def __str__(self):
        return f"{self.street_address}, {self.post_code}, {self.city}"


class Person(ContactInformation):
    REQUIRED_FOR_REVIEW = ["first_name", "last_name"]

    first_name = models.TextField(
        verbose_name=_("First name"), null=False, blank=True, max_length=50
    )

    last_name = models.TextField(
        verbose_name=_("Last name"), null=False, blank=True, max_length=50
    )

    def __str__(self):
        value = super().__str__()
        if all([self.first_name, self.last_name]):
            value = f"{self.first_name} {self.last_name}"
        return value


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

    def __str__(self):
        return self.name


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


class ApplicationRoundStatus(models.Model):
    DRAFT = "draft"
    PUBLISHED = "published"

    STATUS_CHOICES = (
        (DRAFT, _("Draft")),
        (PUBLISHED, _("Published")),
    )

    status = models.CharField(
        max_length=20, verbose_name=_("Status"), choices=STATUS_CHOICES
    )

    application_round = models.ForeignKey(
        "ApplicationRound",
        verbose_name=_("Application round"),
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

    @classmethod
    def get_statuses(cls):
        return [s[0] for s in cls.STATUS_CHOICES]

    def __str__(self):
        return "{} ({})".format(self.get_status_display(), self.application_round.id)


class ApplicationRound(models.Model):
    TARGET_GROUP_INTERNAL = "internal"
    TARGET_GROUP_PUBLIC = "public"
    TARGET_GROUP_ALL = "all"

    TARGET_GROUP_CHOICES = (
        (TARGET_GROUP_INTERNAL, _("Internal")),
        (TARGET_GROUP_PUBLIC, _("Public")),
        (TARGET_GROUP_ALL, _("All")),
    )

    name = models.CharField(
        verbose_name=_("Name"),
        max_length=255,
    )

    target_group = models.CharField(
        max_length=50, verbose_name=_("Target group"), choices=TARGET_GROUP_CHOICES
    )

    reservation_units = models.ManyToManyField(
        ReservationUnit,
        verbose_name=_("Reservation units"),
        related_name="application_rounds",
    )

    application_period_begin = models.DateTimeField(
        verbose_name=_("Application round begin"),
    )
    application_period_end = models.DateTimeField(
        verbose_name=_("Application round end"),
    )

    reservation_period_begin = models.DateField(
        verbose_name=_("Reservation period begin"),
    )
    reservation_period_end = models.DateField(
        verbose_name=_("Reservation period end"),
    )

    public_display_begin = models.DateTimeField(
        verbose_name=_("Public display begin"),
    )
    public_display_end = models.DateTimeField(
        verbose_name=_("Public display end"),
    )

    purposes = models.ManyToManyField(
        Purpose,
        verbose_name=_("Purposes"),
        related_name="application_rounds",
        blank=True,
    )

    service_sector = models.ForeignKey(
        "spaces.ServiceSector",
        verbose_name=_("Service sector"),
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
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
        if status not in ApplicationRoundStatus.get_statuses():
            raise ValidationError(_("Invalid status"))
        ApplicationRoundStatus.objects.create(
            application_round=self, status=status, user=user
        )

    def get_status(self):
        return self.statuses.last()

    def __str__(self):
        return "{} ({} - {})".format(
            self.name, self.reservation_period_begin, self.reservation_period_end
        )


class ApplicationRoundBasket(models.Model):
    CUSTOMER_TYPE_BUSINESS = "business"
    CUSTOMER_TYPE_NONPROFIT = "nonprofit"
    CUSTOMER_TYPE_INDIVIDUAL = "individual"

    CUSTOMER_TYPE_CHOICES = (
        (CUSTOMER_TYPE_BUSINESS, _("Business")),
        (CUSTOMER_TYPE_NONPROFIT, _("Nonprofit")),
        (CUSTOMER_TYPE_INDIVIDUAL, _("Individual")),
    )

    name = models.CharField(
        verbose_name=_("Name"),
        max_length=255,
    )
    application_round = models.ForeignKey(
        ApplicationRound,
        verbose_name=_("Application round"),
        on_delete=models.CASCADE,
        related_name="application_round_baskets",
    )

    purpose = models.ForeignKey(
        "reservation_units.Purpose",
        verbose_name=_("Purpose"),
        related_name="application_round_baskets",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    must_be_main_purpose_of_applicant = models.BooleanField(
        verbose_name=_("Must be main purpose of the applicant"), default=False
    )
    customer_type = ArrayField(
        models.CharField(
            max_length=50, choices=CUSTOMER_TYPE_CHOICES, null=True, blank=True
        ),
    )

    age_groups = models.ManyToManyField("reservations.AgeGroup")
    home_city = models.CharField(max_length=255)
    allocation_percentage = models.PositiveSmallIntegerField(
        verbose_name=_("Allocation percentage"), default=0
    )

    order_number = models.PositiveSmallIntegerField(
        verbose_name=_("Order number"), default=1, null=False, blank=True
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.application_round.name)


class ApplicationStatus(models.Model):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    REVIEW_DONE = "review_done"
    ALLOCATING = "allocating"
    ALLOCATED = "allocated"
    VALIDATED = "validated"
    DECLINED = "declined"
    CANCELLED = "cancelled"
    HANDLED = "handled"

    STATUS_CHOICES = (
        (DRAFT, _("Draft")),
        (IN_REVIEW, _("In review")),
        (REVIEW_DONE, _("Review done")),
        (ALLOCATING, _("Allocating")),
        (ALLOCATED, _("Allocated")),
        (VALIDATED, _("Validated")),
        (DECLINED, _("Declined")),
        (CANCELLED, _("Cancelled")),
        (HANDLED, _("Handled")),
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

    @classmethod
    def get_statuses(cls):
        return [s[0] for s in cls.STATUS_CHOICES]

    def __str__(self):
        return "{} ({})".format(self.get_status_display(), self.application.id)


class ApplicationEventStatus(models.Model):
    CREATED = "created"
    ALLOCATING = "allocating"
    ALLOCATED = "allocated"
    VALIDATED = "validated"
    APPROVED = "approved"
    DECLINED = "declined"
    CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (CREATED, _("Created")),
        (ALLOCATING, _("Allocating")),
        (ALLOCATED, _("Allocated")),
        (VALIDATED, _("Validated")),
        (APPROVED, _("Approved")),
        (DECLINED, _("Declined")),
        (CANCELLED, _("Cancelled")),
    )

    status = models.CharField(
        max_length=20, verbose_name=_("Status"), choices=STATUS_CHOICES
    )

    application_event = models.ForeignKey(
        "ApplicationEvent",
        verbose_name=_("Application event"),
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

    @classmethod
    def get_statuses(cls):
        return [s[0] for s in cls.STATUS_CHOICES]


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

    application_round = models.ForeignKey(
        ApplicationRound,
        verbose_name=_("Applicantion period"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
        related_name="applications",
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
        if status not in ApplicationStatus.get_statuses():
            raise ValidationError(_("Invalid application status"))
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
        if status not in ApplicationEventStatus.get_statuses():
            raise ValidationError(_("Invalid application event status"))
        ApplicationEventStatus.objects.create(
            application_event=self, status=status, user=user
        )

    def get_status(self):
        return self.statuses.last()

    def __str__(self):
        return self.name if self.name else super().__str__()

    def get_all_occurrences(self):

        occurences = {}
        for event_shedule in self.application_event_schedules.all():
            occurences[event_shedule.id] = event_shedule.get_occurences()
        return occurences


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


class EventOccurrence(object):
    def __init__(
        self,
        weekday: int,
        begin: datetime.time,
        end: datetime.time,
        occurrences: [datetime.datetime],
    ):
        self.weekday = weekday
        self.begin = begin
        self.end = end
        self.occurrences = occurrences


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

    def get_occurences(self) -> [EventOccurrence]:
        self.day
        first_matching_day = next_or_current_matching_weekday(
            self.application_event.begin, self.day
        )
        previous_match = previous_or_current_matching_weekday(
            self.application_event.end, self.day
        )
        myrule = recurrence.Rule(
            recurrence.WEEKLY,
            interval=1 if not self.application_event.biweekly else 2,
            byday=self.day,
            until=datetime.datetime(
                year=previous_match.year,
                month=previous_match.month,
                day=previous_match.day,
                hour=self.end.hour,
                minute=self.end.minute,
                second=0,
            ),
        )
        pattern = recurrence.Recurrence(
            dtstart=datetime.datetime(
                year=first_matching_day.year,
                month=first_matching_day.month,
                day=first_matching_day.day,
                hour=self.begin.hour,
                minute=self.begin.minute,
                second=0,
            ),
            rrules=[
                myrule,
            ],
        )
        return EventOccurrence(
            weekday=self.day,
            begin=self.begin,
            end=self.end,
            occurrences=list(pattern.occurrences()),
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
