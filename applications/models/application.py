from datetime import datetime

from django.db import models

from applications.choices import ApplicantTypeChoice, ApplicationRoundStatusChoice, ApplicationStatusChoice
from applications.querysets.application import ApplicationQuerySet
from common.connectors import ApplicationActionsConnector
from common.fields.model import StrChoiceField
from spaces.models import Unit

from .event_reservation_unit import EventReservationUnit

__all__ = [
    "Application",
]


class Application(models.Model):
    applicant_type: str = StrChoiceField(enum=ApplicantTypeChoice, null=True, db_index=True)
    created_date: datetime = models.DateTimeField(auto_now_add=True)
    last_modified_date: datetime = models.DateTimeField(auto_now=True)
    cancelled_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    sent_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    additional_information: str | None = models.TextField(null=True, blank=True)

    application_round = models.ForeignKey(
        "applications.ApplicationRound",
        null=False,
        blank=False,
        on_delete=models.PROTECT,
        related_name="applications",
    )
    organisation = models.ForeignKey(
        "applications.Organisation",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="applications",
    )
    contact_person = models.ForeignKey(
        "applications.Person",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="applications",
    )
    user = models.ForeignKey(
        "users.User",
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name="applications",
    )
    billing_address = models.ForeignKey(
        "applications.Address",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="applications",
    )
    home_city = models.ForeignKey(
        "applications.City",
        on_delete=models.SET_NULL,
        null=True,
        related_name="applications",
    )

    objects = ApplicationQuerySet.as_manager()
    actions = ApplicationActionsConnector()

    class Meta:
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.user} ({self.created_date})"

    @property
    def status(self) -> ApplicationStatusChoice:
        if self.cancelled_date is not None:
            return ApplicationStatusChoice.CANCELLED

        if self.sent_date is None:
            if self.application_round.status.is_draft:
                return ApplicationStatusChoice.DRAFT
            else:
                return ApplicationStatusChoice.EXPIRED

        match self.application_round.status:
            case ApplicationRoundStatusChoice.UPCOMING | ApplicationRoundStatusChoice.OPEN:
                return ApplicationStatusChoice.RECEIVED

            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                if self.has_unallocated_events:
                    return ApplicationStatusChoice.IN_ALLOCATION
                return ApplicationStatusChoice.HANDLED

            case ApplicationRoundStatusChoice.HANDLED:
                return ApplicationStatusChoice.HANDLED

            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return ApplicationStatusChoice.RESULTS_SENT

    @property
    def has_unallocated_events(self) -> bool:
        return self.application_events.all().unallocated().exists()

    @property
    def units(self) -> models.QuerySet[Unit]:
        application_event_ids = self.application_events.all().values("id")
        reservation_unit_ids = EventReservationUnit.objects.filter(
            application_event__in=models.Subquery(application_event_ids)
        ).values("reservation_unit")
        return Unit.objects.filter(reservationunit__in=models.Subquery(reservation_unit_ids))
