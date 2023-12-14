import logging
from datetime import date, datetime

from django.db import models
from django.utils import timezone

from applications.choices import ApplicationRoundStatusChoice, TargetGroupChoice
from applications.querysets.application_round import ApplicationRoundQuerySet
from common.connectors import ApplicationRoundActionsConnector

__all__ = [
    "ApplicationRound",
]

logger = logging.getLogger(__name__)


class ApplicationRound(models.Model):
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
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.name} ({self.reservation_period_begin} - {self.reservation_period_end})"

    @property
    def status(self) -> ApplicationRoundStatusChoice:
        if self.sent_date is not None:
            return ApplicationRoundStatusChoice.RESULTS_SENT
        if self.handled_date is not None:
            return ApplicationRoundStatusChoice.HANDLED
        if self.application_period_begin > timezone.localtime():
            return ApplicationRoundStatusChoice.UPCOMING
        if self.application_period_end > timezone.localtime():
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
