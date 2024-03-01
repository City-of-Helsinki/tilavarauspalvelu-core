import logging
from datetime import date, datetime

from django.db import models
from django.db.models.functions import Now
from django.utils.translation import gettext_lazy as _
from lookup_property import lookup_property

from applications.choices import ApplicationRoundStatusChoice, TargetGroupChoice
from applications.querysets.application_round import ApplicationRoundQuerySet
from common.connectors import ApplicationRoundActionsConnector
from common.date_utils import local_datetime

__all__ = [
    "ApplicationRound",
]


logger = logging.getLogger(__name__)


class ApplicationRound(models.Model):
    """
    Application round for seasonal booking.
    Contains the application, reservation, and public display periods,
    as well as the reservation units or service sectors that can
    be applied for, and for what purposes.
    """

    name: str = models.CharField(max_length=255)
    target_group: str = models.CharField(choices=TargetGroupChoice.choices, max_length=50)
    criteria: str = models.TextField(default="")

    # When the application round accepts reservations
    application_period_begin: datetime = models.DateTimeField()
    application_period_end: datetime = models.DateTimeField()

    # Period where the application in the application round are being allocated to
    reservation_period_begin: date = models.DateField()
    reservation_period_end: date = models.DateField()

    # When the application round is visible to the public
    public_display_begin: datetime = models.DateTimeField()
    public_display_end: datetime = models.DateTimeField()

    handled_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    sent_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)

    reservation_units = models.ManyToManyField(
        "reservation_units.ReservationUnit",
        related_name="application_rounds",
    )
    purposes = models.ManyToManyField(
        "reservations.ReservationPurpose",
        related_name="application_rounds",
    )
    service_sector = models.ForeignKey(
        "spaces.ServiceSector",
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
        related_name="application_rounds",
    )

    objects = ApplicationRoundQuerySet.as_manager()
    actions = ApplicationRoundActionsConnector()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None
    criteria_fi: str | None
    criteria_sv: str | None
    criteria_en: str | None

    class Meta:
        db_table = "application_round"
        base_manager_name = "objects"
        verbose_name = _("Application Round")
        verbose_name_plural = _("Application Rounds")

    def __str__(self) -> str:
        return f"{self.name} ({self.reservation_period_begin} - {self.reservation_period_end})"

    @lookup_property(skip_codegen=True)
    def status() -> ApplicationRoundStatusChoice:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(sent_date__isnull=False),
                then=models.Value(ApplicationRoundStatusChoice.RESULTS_SENT.value),
            ),
            models.When(
                models.Q(handled_date__isnull=False),
                then=models.Value(ApplicationRoundStatusChoice.HANDLED.value),
            ),
            models.When(
                models.Q(application_period_begin__gt=Now()),
                then=models.Value(ApplicationRoundStatusChoice.UPCOMING.value),
            ),
            models.When(
                models.Q(application_period_end__gt=Now()),
                then=models.Value(ApplicationRoundStatusChoice.OPEN.value),
            ),
            default=models.Value(ApplicationRoundStatusChoice.IN_ALLOCATION.value),
            output_field=models.CharField(),
        )

    @status.override
    def _(self) -> ApplicationRoundStatusChoice:
        now = local_datetime()
        if self.sent_date is not None:
            return ApplicationRoundStatusChoice.RESULTS_SENT
        if self.handled_date is not None:
            return ApplicationRoundStatusChoice.HANDLED
        if self.application_period_begin > now:
            return ApplicationRoundStatusChoice.UPCOMING
        if self.application_period_end > now:
            return ApplicationRoundStatusChoice.OPEN
        return ApplicationRoundStatusChoice.IN_ALLOCATION

    @property
    def status_timestamp(self) -> datetime:
        match self.status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return self.public_display_begin
            case ApplicationRoundStatusChoice.OPEN:
                return self.application_period_begin
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return self.application_period_end
            case ApplicationRoundStatusChoice.HANDLED:
                return self.handled_date
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return self.sent_date
