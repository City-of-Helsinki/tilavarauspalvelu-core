from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext_lazy as _

from resources.models import Resource
from services.models import Service
from spaces.models import Space, Unit
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

Q = models.Q


class EquipmentCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)

    def __str__(self):
        return self.name


class Equipment(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)
    category = models.ForeignKey(
        EquipmentCategory,
        verbose_name=_("Category"),
        related_name="equipment",
        on_delete=models.CASCADE,
        null=False,
    )

    def __str__(self):
        return self.name


class ReservationUnitType(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    def __str__(self):
        return self.name


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(
        verbose_name=_("Description"), max_length=512, blank=True, default=""
    )
    spaces = models.ManyToManyField(
        Space, verbose_name=_("Spaces"), related_name="reservation_units", blank=True
    )
    resources = models.ManyToManyField(
        Resource,
        verbose_name=_("Resources"),
        related_name="reservation_units",
        blank=True,
    )
    services = models.ManyToManyField(
        Service,
        verbose_name=_("Services"),
        related_name="reservation_units",
        blank=True,
    )
    purposes = models.ManyToManyField(
        "Purpose",
        verbose_name=_("Purposes"),
        related_name="reservation_units",
        blank=True,
    )
    reservation_unit_type = models.ForeignKey(
        ReservationUnitType,
        verbose_name=_("Type"),
        related_name="reservation_units",
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )
    require_introduction = models.BooleanField(
        verbose_name=_("Require introduction"), default=False
    )
    equipments = models.ManyToManyField(
        Equipment,
        verbose_name=_("Equipments"),
        blank=True,
    )
    terms_of_use = models.TextField(
        verbose_name=_("Terms of use"), blank=True, max_length=2000
    )
    unit = models.ForeignKey(
        Unit,
        verbose_name=_("Unit"),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
    )

    def __str__(self):
        return "{}".format(self.name)

    def get_location(self):
        # For now we assume that if reservation has multiple spaces they all have same location
        spaces = self.spaces.all()
        return next(
            (space.location for space in spaces if hasattr(space, "location")), None
        )

    def get_building(self):
        # For now we assume that if reservation has multiple spaces they all have same building
        spaces = self.spaces.all()
        return next(
            (space.building for space in spaces if hasattr(space, "building")), None
        )

    def get_max_persons(self):
        # Sum of max persons for all spaces because group can be divided to different spaces
        spaces = self.spaces.all()
        return sum(filter(None, (space.max_persons for space in spaces))) or None

    def check_required_introduction(self, user):
        return Introduction.objects.filter(reservation_unit=self, user=user).exists()

    def check_reservation_overlap(self, start_time, end_time, reservation=None):
        from reservations.models import STATE_CHOICES, Reservation

        spaces = []

        for space in self.spaces.all():
            spaces += list(space.get_family())

        reservation_units_with_same_components = ReservationUnit.objects.filter(
            Q(resources__in=self.resources.all()) | Q(spaces__in=spaces)
        ).distinct()

        qs = Reservation.objects.filter(
            reservation_unit__in=reservation_units_with_same_components,
            end__gt=start_time,
            begin__lt=end_time,
        ).exclude(state__in=[STATE_CHOICES.CANCELLED, STATE_CHOICES.DENIED])

        # If updating an existing reservation, allow "overlapping" it's old time
        if reservation:
            qs = qs.exclude(pk=reservation.pk)

        return qs.exists()


class ReservationUnitImage(models.Model):
    TYPES = (
        ("main", _("Main image")),
        ("ground_plan", _("Ground plan")),
        ("map", _("Map")),
        ("other", _("Other")),
    )

    image_type = models.CharField(max_length=20, verbose_name=_("Type"), choices=TYPES)

    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit image"),
        related_name="images",
        on_delete=models.CASCADE,
    )
    image_url = models.URLField(verbose_name=_("Image url"), max_length=255)

    def __str__(self):
        return "{} ({})".format(
            self.reservation_unit.name, self.get_image_type_display()
        )


class Purpose(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Period(models.Model):
    """
    A period of time to express state of open or closed
    Days that specifies the actual activity hours link here
    """

    LENGTH_WITHIN_DAY = "within_day"
    LENGTH_WHOLE_DAY = "whole_day"
    LENGTH_OVER_NIGHT = "over_night"
    RESERVATION_LENGHT_TYPE_CHOICES = (
        (LENGTH_WITHIN_DAY, _("within day")),
        (LENGTH_WHOLE_DAY, _("whole day")),
        (LENGTH_OVER_NIGHT, _("over night")),
    )

    reservation_length_type = models.CharField(
        max_length=16,
        choices=RESERVATION_LENGHT_TYPE_CHOICES,
        verbose_name=_("Reservations length type"),
        default=LENGTH_WITHIN_DAY,
    )
    reservation_unit = models.ForeignKey(
        ReservationUnit,
        verbose_name=_("Reservation unit"),
        db_index=True,
        null=True,
        blank=True,
        related_name="periods",
        on_delete=models.CASCADE,
    )

    start = models.DateField(verbose_name=_("Start date"))
    end = models.DateField(verbose_name=_("End date"))

    name = models.CharField(
        max_length=200, verbose_name=_("Name"), blank=True, default=""
    )
    description = models.CharField(
        verbose_name=_("Description"), null=True, blank=True, max_length=500
    )
    closed = models.BooleanField(
        verbose_name=_("Closed"), default=False, editable=False
    )

    def __str__(self):
        return "{}({} - {})".format(self.reservation_unit.name, self.start, self.end)


class Day(models.Model):
    """
    Day of week and its active start and end time and whether it is open or closed

    Kirjastot.fi API uses closed for both days and periods, don't know which takes precedence
    """

    DAYS_OF_WEEK = (
        (0, _("Monday")),
        (1, _("Tuesday")),
        (2, _("Wednesday")),
        (3, _("Thursday")),
        (4, _("Friday")),
        (5, _("Saturday")),
        (6, _("Sunday")),
    )

    period = models.ForeignKey(
        Period,
        verbose_name=_("Period"),
        db_index=True,
        related_name="days",
        on_delete=models.CASCADE,
    )
    weekday = models.IntegerField(verbose_name=_("Weekday"), choices=DAYS_OF_WEEK)
    opens = models.TimeField(verbose_name=_("Time when opens"), null=True, blank=True)
    closes = models.TimeField(verbose_name=_("Time when closes"), null=True, blank=True)

    def __str__(self):
        return "{}({})".format(
            self.get_weekday_display(), self.period.reservation_unit.name
        )


class DayPart(models.Model):
    ALLOWED_EVERYONE = "allowed_everyone"
    ALLOWED_PUBLIC = "allowed_public"
    ALLOWED_STAFF = "allowed_staff"

    ALLOWED_GROUP_CHOICES = (
        (ALLOWED_EVERYONE, _("Everyone allowed")),
        (ALLOWED_PUBLIC, _("Public allowed")),
        (ALLOWED_STAFF, _("Staff allowed")),
    )

    allowed_group = models.CharField(max_length=255, choices=ALLOWED_GROUP_CHOICES)
    begin = models.TimeField(
        verbose_name=_("Begin time of day part"), null=True, blank=True
    )
    end = models.TimeField(
        verbose_name=_("End time of day part"), null=True, blank=True
    )
    day = models.ForeignKey(Day, verbose_name=_("Day"), on_delete=models.CASCADE)

    def __str__(self):
        return "{} {} ({}-{})".format(
            self.day.period.reservation_unit.name,
            self.day.get_weekday_display(),
            self.begin,
            self.end,
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


AuditLogger.register(ReservationUnit)
