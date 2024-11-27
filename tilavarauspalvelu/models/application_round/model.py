from __future__ import annotations

import datetime
from functools import cached_property
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import (
    ApplicationRoundReservationCreationStatusChoice,
    ApplicationRoundStatusChoice,
    ApplicationStatusChoice,
)
from utils.date_utils import local_datetime
from utils.db import NowTT

from .queryset import ApplicationRoundManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import TermsOfUse, Unit

    from .actions import ApplicationRoundActions


__all__ = [
    "ApplicationRound",
]


class ApplicationRound(models.Model):
    """
    Application round for seasonal booking.
    Contains the application, reservation, and public display periods,
    as well as the reservation units that can be applied for, and for what purposes.
    """

    name: str = models.CharField(max_length=255)
    criteria: str = models.TextField(default="")
    notes_when_applying: str = models.TextField(blank=True, default="")

    # Period when the application round accepts applications
    application_period_begin: datetime.datetime = models.DateTimeField()
    application_period_end: datetime.datetime = models.DateTimeField()

    # Period where the reservations from the application round's applications will be allocated to
    reservation_period_begin: datetime.date = models.DateField()
    reservation_period_end: datetime.date = models.DateField()

    # When the application round is visible to the public
    public_display_begin: datetime.datetime = models.DateTimeField()
    public_display_end: datetime.datetime = models.DateTimeField()

    handled_date: datetime.datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    sent_date: datetime.datetime | None = models.DateTimeField(null=True, blank=True, default=None)

    reservation_units = models.ManyToManyField(
        "tilavarauspalvelu.ReservationUnit",
        related_name="application_rounds",
    )
    purposes = models.ManyToManyField(
        "tilavarauspalvelu.ReservationPurpose",
        related_name="application_rounds",
    )
    terms_of_use: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="application_rounds",
        on_delete=models.SET_NULL,
        null=True,
    )

    objects = ApplicationRoundManager()

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None
    criteria_fi: str | None
    criteria_sv: str | None
    criteria_en: str | None
    notes_when_applying_fi: str | None
    notes_when_applying_sv: str | None
    notes_when_applying_en: str | None

    class Meta:
        db_table = "application_round"
        base_manager_name = "objects"
        verbose_name = _("application round")
        verbose_name_plural = _("application rounds")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.name} ({self.reservation_period_begin} - {self.reservation_period_end})"

    @cached_property
    def actions(self) -> ApplicationRoundActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ApplicationRoundActions

        return ApplicationRoundActions(self)

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
                models.Q(application_period_begin__gt=NowTT()),
                then=models.Value(ApplicationRoundStatusChoice.UPCOMING.value),
            ),
            models.When(
                models.Q(application_period_end__gt=NowTT()),
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

    @lookup_property(skip_codegen=True)
    def status_timestamp() -> datetime.datetime:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(sent_date__isnull=False),  # RESULTS_SENT
                then=models.F("sent_date"),
            ),
            models.When(
                models.Q(handled_date__isnull=False),  # HANDLED
                then=models.F("handled_date"),
            ),
            models.When(
                models.Q(application_period_begin__gt=NowTT()),  # UPCOMING
                then=models.F("public_display_begin"),
            ),
            models.When(
                models.Q(application_period_end__gt=NowTT()),  # OPEN
                then=models.F("application_period_begin"),
            ),
            default=models.F("application_period_end"),  # IN_ALLOCATION
            output_field=models.DateTimeField(),
        )

    @status_timestamp.override
    def _(self) -> datetime.datetime:
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

    @lookup_property(skip_codegen=True)
    def is_setting_handled_allowed() -> bool:
        """
        Can this Application Round be set to HANDLED?

        Note: As lookup_properties are stateless, we can only check for statuses.
        The user permissions must also be checked: ApplicationRoundPermission.has_update_permission(root, user, {})
        """
        from tilavarauspalvelu.models import Application

        return models.Case(  # type: ignore[return-value]
            models.When(
                ~models.Q(L(status=ApplicationRoundStatusChoice.IN_ALLOCATION)),
                then=False,
            ),
            models.When(
                models.Exists(
                    Application.objects.filter(
                        models.Q(application_round=models.OuterRef("id")),
                        models.Q(L(status=ApplicationStatusChoice.IN_ALLOCATION)),
                    )
                ),
                then=False,
            ),
            default=True,
            output_field=models.BooleanField(),
        )

    @is_setting_handled_allowed.override
    def _(self) -> bool:
        """
        Can this Application Round be set to HANDLED?

        Note: As lookup_properties are stateless, we can only check for statuses.
        The user permissions must also be checked: ApplicationRoundPermission.has_update_permission(root, user, {})
        """
        if self.status != ApplicationRoundStatusChoice.IN_ALLOCATION:
            return False

        return not self.applications.filter(L(status=ApplicationStatusChoice.IN_ALLOCATION)).exists()

    @lookup_property(skip_codegen=True)
    def reservation_creation_status() -> ApplicationRoundReservationCreationStatusChoice:
        from tilavarauspalvelu.models import RecurringReservation

        timeout = datetime.timedelta(minutes=settings.APPLICATION_ROUND_RESERVATION_CREATION_TIMEOUT_MINUTES)

        recurring_reservation_filters = {
            "allocated_time_slot__reservation_unit_option__application_section__application__application_round": (
                models.OuterRef("id")
            )
        }

        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(handled_date__isnull=True),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED.value),
            ),
            models.When(
                models.Exists(RecurringReservation.objects.filter(**recurring_reservation_filters)),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.COMPLETED.value),
            ),
            models.When(
                models.Q(handled_date__lte=NowTT() - timeout),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.FAILED.value),
            ),
            default=models.Value(ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED.value),
            output_field=models.CharField(),
        )

    @reservation_creation_status.override
    def _(self) -> ApplicationRoundReservationCreationStatusChoice:
        from tilavarauspalvelu.models import RecurringReservation

        now = local_datetime()
        timeout = datetime.timedelta(minutes=settings.APPLICATION_ROUND_RESERVATION_CREATION_TIMEOUT_MINUTES)

        if self.handled_date is None:
            return ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED

        if RecurringReservation.objects.filter(
            allocated_time_slot__reservation_unit_option__application_section__application__application_round=self
        ).exists():
            return ApplicationRoundReservationCreationStatusChoice.COMPLETED

        if self.handled_date < now - timeout:
            return ApplicationRoundReservationCreationStatusChoice.FAILED

        return ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED

    @property
    def units_for_permissions(self) -> list[Unit]:
        from tilavarauspalvelu.models import Unit

        if hasattr(self, "_units_for_permissions"):
            return self._units_for_permissions

        self._units_for_permissions = list(
            Unit.objects.filter(reservation_units__application_rounds=self).prefetch_related("unit_groups").distinct()
        )
        return self._units_for_permissions

    @units_for_permissions.setter
    def units_for_permissions(self, value: list[Unit]) -> None:
        # The setter is used by ApplicationRoundQuerySet to pre-evaluate units for multiple ApplicationRounds.
        # Should not be used by anything else!
        self._units_for_permissions = value
