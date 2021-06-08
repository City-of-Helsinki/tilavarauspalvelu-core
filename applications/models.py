import datetime
import logging
import math
import uuid
from typing import Dict, List, Optional

import recurrence
from django.contrib.auth import get_user_model
from django.contrib.postgres.fields import ArrayField
from django.db import Error, models
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from recurrence.fields import RecurrenceField
from rest_framework.exceptions import ValidationError
from sentry_sdk import capture_message

from applications.base_models import ContactInformation
from applications.utils.aggregate_data import (
    ApplicationAggregateDataCreator,
    ApplicationRoundAggregateDataCreator,
)
from reservation_units.models import Purpose, ReservationUnit
from spaces.models import District
from tilavarauspalvelu.utils.date_util import (
    next_or_current_matching_weekday,
    previous_or_current_matching_weekday,
)

logger = logging.getLogger(__name__)

User = get_user_model()

DAY_CHOICES = (
    (0, _("Monday")),
    (1, _("Tuesday")),
    (2, _("Wednesday")),
    (3, _("Thursday")),
    (4, _("Friday")),
    (5, _("Saturday")),
    (6, _("Sunday")),
)


def year_not_in_future(year: Optional[int]):
    if year is None:
        return

    current_date = datetime.datetime.now()

    if current_date.year < year:
        msg = _("is after current year")
        raise ValidationError(format_lazy("{year} {msg}", year=year, msg=msg))


class AggregateDataBase(models.Model):
    class Meta:
        abstract = True

    name = models.CharField(max_length=255, verbose_name=_("Name"))
    value = models.FloatField(
        max_length=255, verbose_name=_("Value"), null=True, default=0
    )


class Address(models.Model):
    street_address = models.TextField(
        verbose_name=_("Street address"), null=False, blank=False, max_length=80
    )

    post_code = models.CharField(
        verbose_name=_("Post code"),
        max_length=5,
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
        verbose_name=_("First name"), null=False, blank=False, max_length=50
    )

    last_name = models.TextField(
        verbose_name=_("Last name"), null=False, blank=False, max_length=50
    )

    def __str__(self):
        value = super().__str__()
        if all([self.first_name, self.last_name]):
            value = f"{self.first_name} {self.last_name}"
        return value


class Organisation(models.Model):
    COMPANY = "company"
    REGISTERED_ASSOCIATION = "registered_association"
    PUBLIC_ASSOCIATION = "public_association"
    UNREGISTERED_ASSOCIATION = "unregistered_association"
    MUNICIPALITY_CONSORTIUM = "municipality_consortium"
    RELIGIOUS_COMMUNITY = "religious_community"

    TYPE_CHOICES = [
        (COMPANY, _("Company")),
        (REGISTERED_ASSOCIATION, _("Registered association")),
        (PUBLIC_ASSOCIATION, _("Public association")),
        (UNREGISTERED_ASSOCIATION, _("Unregistered association")),
        (MUNICIPALITY_CONSORTIUM, _("Municipality consortium")),
        (RELIGIOUS_COMMUNITY, _("Religious community")),
    ]

    name = models.TextField(
        verbose_name=_("Name"),
        null=False,
        blank=False,
        max_length=255,
    )

    identifier = models.TextField(
        verbose_name=_("Organisation identifier"),
        null=True,
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
        Address, null=True, blank=False, on_delete=models.SET_NULL
    )

    active_members = models.PositiveIntegerField(
        verbose_name=_("Active members"),
        null=True,
        blank=False,
    )
    core_business = models.TextField(
        verbose_name=_("Core business of this organization"),
        blank=True,
    )

    organisation_type = models.CharField(
        max_length=255, choices=TYPE_CHOICES, default=COMPANY
    )

    email = models.EmailField(
        verbose_name=_("Email"),
        default="",
        blank=False,
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
    IN_REVIEW = "in_review"
    REVIEW_DONE = "review_done"
    ALLOCATED = "allocated"
    HANDLED = "handled"
    VALIDATED = "validated"
    APPROVED = "approved"
    STATUS_CHOICES = (
        (DRAFT, _("Draft")),
        (IN_REVIEW, _("In review")),
        (REVIEW_DONE, _("Review done")),
        (ALLOCATED, _("Allocated")),
        (HANDLED, _("Handled")),
        (VALIDATED, _("Validated")),
        (APPROVED, _("Approved")),
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

    allocating = models.BooleanField(
        verbose_name=_("Allocating"), blank=True, default=False
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
    )

    service_sector = models.ForeignKey(
        "spaces.ServiceSector",
        verbose_name=_("Service sector"),
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
    )

    criteria = models.TextField(default="")

    def __str__(self):
        return "{} ({} - {})".format(
            self.name, self.reservation_period_begin, self.reservation_period_end
        )

    @property
    def status(self):
        return self.get_status().status

    @property
    def status_timestamp(self):
        return self.get_status().timestamp

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

    def get_application_events_by_basket(self):

        matching_application_events: Dict[int, List[ApplicationEvent]] = {}
        for basket in self.application_round_baskets.order_by("order_number").all():
            matching_application_events[
                basket.id
            ] = basket.get_application_events_in_basket()
        return matching_application_events

    def create_aggregate_data(self):
        ApplicationRoundAggregateDataCreator(self).start()

    @property
    def aggregated_data_dict(self):
        ret_dict = {}
        for row in self.aggregated_data.all():
            ret_dict[row.name] = row.value
        return ret_dict


class ApplicationRoundAggregateData(AggregateDataBase):
    application_round = models.ForeignKey(
        ApplicationRound, on_delete=models.CASCADE, related_name="aggregated_data"
    )


class City(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=100)


class CUSTOMER_TYPE_CONST(object):
    __slots__ = ()

    CUSTOMER_TYPE_BUSINESS = "business"
    CUSTOMER_TYPE_NONPROFIT = "nonprofit"
    CUSTOMER_TYPE_INDIVIDUAL = "individual"
    CUSTOMER_TYPE_CHOICES = (
        (CUSTOMER_TYPE_BUSINESS, _("Business")),
        (CUSTOMER_TYPE_NONPROFIT, _("Nonprofit")),
        (CUSTOMER_TYPE_INDIVIDUAL, _("Individual")),
    )


CUSTOMER_TYPES = CUSTOMER_TYPE_CONST()


class APPLICANT_TYPE_CONST(object):
    __slots__ = ()
    APPLICANT_TYPE_INDIVIDUAL = "individual"
    APPLICANT_TYPE_ASSOCIATION = "association"
    APPLICANT_TYPE_COMMUNITY = "community"
    APPLICANT_TYPE_COMPANY = "company"

    APPLICANT_TYPE_CHOICES = (
        (APPLICANT_TYPE_INDIVIDUAL, _("Individual")),
        (APPLICANT_TYPE_ASSOCIATION, _("Association")),
        (APPLICANT_TYPE_COMMUNITY, _("Community")),
        (APPLICANT_TYPE_COMPANY, _("Company")),
    )


APPLICANT_TYPES = APPLICANT_TYPE_CONST()


def customer_types_to_applicant_types(
    customer_types: [CUSTOMER_TYPES],
) -> APPLICANT_TYPES:
    applicant_types = []
    switcher = {
        CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS: [APPLICANT_TYPES.APPLICANT_TYPE_COMPANY],
        CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT: [
            APPLICANT_TYPES.APPLICANT_TYPE_ASSOCIATION,
            APPLICANT_TYPES.APPLICANT_TYPE_COMMUNITY,
        ],
        CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL: [
            APPLICANT_TYPES.APPLICANT_TYPE_INDIVIDUAL
        ],
    }

    for type in customer_types:
        applicant_types += switcher[type]
    return applicant_types


class ApplicationRoundBasket(CUSTOMER_TYPE_CONST, models.Model):

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

    purposes = models.ManyToManyField(
        "reservation_units.Purpose", verbose_name=_("Purposes"), blank=True
    )

    must_be_main_purpose_of_applicant = models.BooleanField(
        verbose_name=_("Must be main purpose of the applicant"), default=False
    )
    customer_type = ArrayField(
        models.CharField(
            max_length=50,
            choices=CUSTOMER_TYPES.CUSTOMER_TYPE_CHOICES,
            null=True,
            blank=True,
        ),
    )

    age_groups = models.ManyToManyField("reservations.AgeGroup")

    home_city = models.ForeignKey(
        City,
        verbose_name=_("Home city"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    allocation_percentage = models.PositiveSmallIntegerField(
        verbose_name=_("Allocation percentage"), default=0
    )

    order_number = models.PositiveSmallIntegerField(
        verbose_name=_("Order number"), default=1, null=False, blank=True
    )

    def get_application_events_in_basket(self):
        events = ApplicationEvent.objects.filter(
            application__application_round=self.application_round
        )

        if self.home_city is not None:
            events = events.filter(application__home_city=self.home_city)
        if len(self.purposes.all()) > 0:
            events = events.filter(purpose__in=self.purposes.all())
        if len(self.age_groups.all()) > 0:
            events = events.filter(age_group__in=self.age_groups.all())
        if self.customer_type is not None and len(self.customer_type) > 0:
            events = events.filter(
                application__applicant_type__in=customer_types_to_applicant_types(
                    self.customer_type
                )
            )
        return list(events.all())

    def get_score(self):
        # TODO: Super scoring, needs to be defined how to use this properly.
        # Used for allocation scoring logic, so something is needed atm.
        return math.ceil(10 / self.order_number)

    def __str__(self):
        return "{} ({})".format(self.name, self.application_round.name)


class ApplicationStatus(models.Model):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    REVIEW_DONE = "review_done"
    SENT = "sent"
    DECLINED = "declined"
    CANCELLED = "cancelled"

    STATUS_CHOICES = (
        (DRAFT, _("Draft")),
        (IN_REVIEW, _("In review")),
        (REVIEW_DONE, _("Review done")),
        (SENT, _("Decision sent")),
        (DECLINED, _("Declined")),
        (CANCELLED, _("Cancelled")),
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
    ALLOCATED = "allocated"
    VALIDATED = "validated"
    APPROVED = "approved"
    DECLINED = "declined"

    STATUS_CHOICES = (
        (CREATED, _("Created")),
        (ALLOCATED, _("Allocated")),
        (VALIDATED, _("Validated")),
        (APPROVED, _("Approved")),
        (DECLINED, _("Declined")),
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


class Application(APPLICANT_TYPE_CONST, models.Model):

    applicant_type = models.CharField(
        max_length=64,
        verbose_name=_("Applicant type"),
        choices=APPLICANT_TYPES.APPLICANT_TYPE_CHOICES,
        null=True,
    )

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

    billing_address = models.ForeignKey(
        Address, null=True, blank=True, on_delete=models.SET_NULL
    )

    # Automatically updated through signal.
    cached_latest_status = models.CharField(
        db_index=True,
        max_length=20,
        default="draft",
        verbose_name=_("Cached latest status"),
        blank=True,
    )

    home_city = models.ForeignKey(
        City,
        verbose_name=_("Home city"),
        on_delete=models.SET_NULL,
        null=True,
    )

    created_date = models.DateTimeField(auto_now_add=True)
    last_modified_date = models.DateTimeField(auto_now=True)

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

    def create_aggregate_data(self):
        # No threading at this point.
        ApplicationAggregateDataCreator(self).run()

    @property
    def aggregated_data_dict(self):
        ret_dict = {}
        for row in self.aggregated_data.all():
            ret_dict[row.name] = row.value
        return ret_dict


class ApplicationAggregateData(AggregateDataBase):
    """Model to store aggregated data from application events.

    Overall hour counts, application event counts etc.
    """

    application = models.ForeignKey(
        Application, on_delete=models.CASCADE, related_name="aggregated_data"
    )


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

    declined_reservation_units = models.ManyToManyField(
        ReservationUnit,
        verbose_name=_("Declined reservation units"),
        blank=True,
    )

    uuid = models.UUIDField(default=uuid.uuid4, null=False, editable=False, unique=True)

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

    @property
    def is_approved(self):
        return self.statuses.filter(status=ApplicationEventStatus.APPROVED).exists()

    def __str__(self):
        return self.name if self.name else super().__str__()

    def get_not_scheduled_occurrences(self):
        occurences = {}
        for event_shedule in filter(
            lambda event: not hasattr(event, "application_event_schedule_result")
            or event.application_event_schedule_result.accepted is False,
            self.application_event_schedules.all(),
        ):
            occurences[event_shedule.id] = event_shedule.get_occurences()
        return occurences

    def get_all_occurrences(self):

        occurences = {}
        for event_shedule in self.application_event_schedules.all():
            occurences[event_shedule.id] = event_shedule.get_occurences()
        return occurences

    def get_all_result_occurrences(self):
        occurrences = {}

        for schedule in self.application_event_schedules.all():
            occurrences[schedule.id] = schedule.get_occurences()

    def create_aggregate_data(self):
        total_events = []
        total_events_durations = []
        for schedule in self.application_event_schedules.all():
            events_count = len(schedule.get_occurences().occurrences)
            total_events.append(events_count)

            total_events_durations.append(
                (self.min_duration * events_count).total_seconds()
            )

        total_events_durations = sorted(total_events_durations, reverse=True)[
            : self.events_per_week
        ]
        total_events_duration = sum(total_events_durations) / 3600.0

        total_amounts_of_events = sum(
            sorted(total_events, reverse=True)[: self.events_per_week]
        )
        try:
            name = "duration_total"
            ApplicationEventAggregateData.objects.update_or_create(
                application_event=self,
                name=name,
                defaults={"value": total_events_duration},
            )

            name = "reservations_total"
            ApplicationEventAggregateData.objects.update_or_create(
                application_event=self,
                name=name,
                defaults={"value": total_amounts_of_events},
            )
        except Error:
            capture_message(
                "Caught an error while saving event aggregate data", level="error"
            )
        else:
            logger.info("Event #{} aggregate data created.".format(self.id))

    def create_schedule_result_aggregated_data(self):
        total_amount_of_events = []
        total_events_duration = []
        for schedule in self.application_event_schedules.all():
            if not hasattr(schedule, "application_event_schedule_result"):
                continue

            schedule.application_event_schedule_result.create_aggregate_data()

            if schedule.application_event_schedule_result.declined:
                continue

            amount_of_events = len(
                schedule.application_event_schedule_result.get_result_occurrences().occurrences
            )
            total_amount_of_events.append(amount_of_events)
            total_events_duration.append(
                (
                    amount_of_events
                    * schedule.application_event_schedule_result.allocated_duration
                ).total_seconds()
            )

        total_reservations = sum(total_amount_of_events)
        total_events_duration = sum(total_events_duration)

        try:
            name = "allocation_results_duration_total"
            ApplicationEventAggregateData.objects.update_or_create(
                application_event=self,
                name=name,
                defaults={"value": total_events_duration},
            )

            name = "allocation_results_reservations_total"
            ApplicationEventAggregateData.objects.update_or_create(
                application_event=self,
                name=name,
                defaults={"value": total_reservations},
            )
        except Error:
            capture_message(
                "Caught an error while saving event schedule result aggregate data",
                level="error",
            )
        else:
            logger.info(
                "Event schedule result #{} aggregate data created.".format(self.pk)
            )

    @property
    def aggregated_data_dict(self):
        ret_dict = {}
        for row in self.aggregated_data.all():
            ret_dict[row.name] = row.value
        return ret_dict


class ApplicationEventAggregateData(AggregateDataBase):
    """Model to store aggregated data for single application event.

    Overall hour counts etc.
    """

    application_event = models.ForeignKey(
        ApplicationEvent, on_delete=models.CASCADE, related_name="aggregated_data"
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
    day = models.IntegerField(verbose_name=_("Day"), choices=DAY_CHOICES, null=False)

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


class ApplicationEventScheduleResult(models.Model):

    accepted = models.BooleanField(default=False, null=False)

    declined = models.BooleanField(default=False, null=False)

    application_event_schedule = models.OneToOneField(
        ApplicationEventSchedule,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="application_event_schedule_result",
    )

    allocated_reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit", on_delete=models.CASCADE
    )

    allocated_duration = models.DurationField()
    allocated_day = models.IntegerField(
        verbose_name=_("Day"), choices=DAY_CHOICES, null=False
    )

    allocated_begin = models.TimeField(
        verbose_name=_("Start"),
        null=False,
        blank=False,
    )

    allocated_end = models.TimeField(
        verbose_name=_("End"),
        null=False,
        blank=False,
    )

    basket = models.ForeignKey(
        ApplicationRoundBasket,
        on_delete=models.SET_NULL,
        null=True,
    )

    @property
    def aggregated_data_dict(self):
        ret_dict = {}
        for row in self.aggregated_data.all():
            ret_dict[row.name] = row.value
        return ret_dict

    def get_result_occurrences(self) -> [EventOccurrence]:
        application_event = self.application_event_schedule.application_event
        begin = application_event.begin
        end = application_event.end

        first_matching_day = next_or_current_matching_weekday(begin, self.allocated_day)
        previous_match = previous_or_current_matching_weekday(end, self.allocated_day)
        myrule = recurrence.Rule(
            recurrence.WEEKLY,
            interval=1 if not application_event.biweekly else 2,
            byday=self.allocated_day,
            until=datetime.datetime(
                year=previous_match.year,
                month=previous_match.month,
                day=previous_match.day,
                hour=self.allocated_end.hour,
                minute=self.allocated_end.minute,
                second=0,
            ),
        )
        pattern = recurrence.Recurrence(
            dtstart=datetime.datetime(
                year=first_matching_day.year,
                month=first_matching_day.month,
                day=first_matching_day.day,
                hour=self.allocated_begin.hour,
                minute=self.allocated_begin.minute,
                second=0,
            ),
            rrules=[
                myrule,
            ],
        )
        return EventOccurrence(
            weekday=self.allocated_day,
            begin=self.allocated_begin,
            end=self.allocated_end,
            occurrences=list(pattern.occurrences()),
        )

    def create_aggregate_data(self):
        total_amount_of_events = len(self.get_result_occurrences().occurrences)
        total_events_duration = (
            total_amount_of_events * self.allocated_duration
        ).total_seconds()

        try:
            name = "duration_total"
            ApplicationEventScheduleResultAggregateData.objects.update_or_create(
                schedule_result=self,
                name=name,
                defaults={"value": total_events_duration},
            )

            name = "reservations_total"
            ApplicationEventScheduleResultAggregateData.objects.update_or_create(
                schedule_result=self,
                name=name,
                defaults={"value": total_amount_of_events},
            )
        except Error:
            capture_message(
                "Caught an error while saving schedule result aggregate data",
                level="error",
            )
        else:
            logger.info("Schedule result #{} aggregate data created.".format(self.pk))


class ApplicationEventScheduleResultAggregateData(AggregateDataBase):
    schedule_result = models.ForeignKey(
        ApplicationEventScheduleResult,
        on_delete=models.CASCADE,
        related_name="aggregated_data",
    )


class ApplicationEventWeeklyAmountReduction(models.Model):

    application_event = models.ForeignKey(
        ApplicationEvent,
        verbose_name=_("Application event"),
        related_name="weekly_amount_reductions",
        on_delete=models.CASCADE,
    )

    application_event_schedule_result = models.ForeignKey(
        ApplicationEventScheduleResult,
        null=True,
        verbose_name=_("Application event schedule result"),
        on_delete=models.SET_NULL,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("User"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    created_date = models.DateTimeField(auto_now_add=True)
