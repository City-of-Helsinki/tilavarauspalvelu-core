from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import User

from spaces.models import Space
from resources.models import Resource
from services.models import Service

Q = models.Q


class ReservationUnit(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

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

    require_introduction = models.BooleanField(
        verbose_name=_("Require introduction"), default=False
    )

    def __str__(self):
        return "{}".format(self.name)

    def check_required_introduction(self, user):
        return Introduction.objects.filter(reservation_unit=self, user=user).exists()

    def check_reservation_overlap(self, start_time, end_time):
        from reservations.models import Reservation

        reservation_units_with_same_components = ReservationUnit.objects.filter(
            Q(resources__in=self.resources.all()) | Q(spaces__in=self.spaces.all())
        )

        return Reservation.objects.filter(
            reservation_unit__in=reservation_units_with_same_components,
            end__gt=start_time,
            begin__lt=end_time,
        ).exists()


class Purpose(models.Model):
    name = models.CharField(max_length=200)
    reservation_unit = models.ManyToManyField(
        ReservationUnit, verbose_name=_("Purpose"), related_name="purposes"
    )


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
