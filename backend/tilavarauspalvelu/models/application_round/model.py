from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_nh3.models import Nh3Field
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import (
    ApplicationRoundReservationCreationStatusChoice,
    ApplicationRoundStatusChoice,
    ApplicationStatusChoice,
    ReservationKind,
    TermsOfUseTypeChoices,
)
from utils.date_utils import local_datetime
from utils.db import Now
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, ReservationPurpose, ReservationUnit, TermsOfUse, Unit
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager, OneToManyRelatedManager
    from tilavarauspalvelu.models.application.queryset import ApplicationQuerySet
    from tilavarauspalvelu.models.reservation_purpose.queryset import ReservationPurposeQuerySet
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

    from .actions import ApplicationRoundActions
    from .queryset import ApplicationRoundManager
    from .validators import ApplicationRoundValidator


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
    criteria: str = Nh3Field(
        blank=True,
        default="",
        tags=settings.NH3_ALLOWED_TAGS,
        attributes=settings.NH3_ALLOWED_ATTRIBUTES,
    )
    notes_when_applying: str = Nh3Field(
        blank=True,
        default="",
        tags=settings.NH3_ALLOWED_TAGS,
        attributes=settings.NH3_ALLOWED_ATTRIBUTES,
    )

    # Period when the application round accepts applications
    application_period_begins_at: datetime.datetime = models.DateTimeField()
    application_period_ends_at: datetime.datetime = models.DateTimeField()

    # Period where the reservations from the application round's applications will be allocated to
    reservation_period_begin_date: datetime.date = models.DateField()
    reservation_period_end_date: datetime.date = models.DateField()

    # When the application round is visible to the public
    public_display_begins_at: datetime.datetime = models.DateTimeField()
    public_display_ends_at: datetime.datetime = models.DateTimeField()

    handled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    sent_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    reservation_units: ManyToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet] = models.ManyToManyField(
        "tilavarauspalvelu.ReservationUnit",
        related_name="application_rounds",
        limit_choices_to=models.Q(reservation_kind__in=ReservationKind.allows_season),
    )
    purposes: ManyToManyRelatedManager[ReservationPurpose, ReservationPurposeQuerySet] = models.ManyToManyField(
        "tilavarauspalvelu.ReservationPurpose",
        related_name="application_rounds",
    )
    terms_of_use: TermsOfUse | None = models.ForeignKey(
        "tilavarauspalvelu.TermsOfUse",
        related_name="application_rounds",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        limit_choices_to=models.Q(terms_type=TermsOfUseTypeChoices.RECURRING),
    )

    objects: ClassVar[ApplicationRoundManager] = LazyModelManager.new()
    actions: ApplicationRoundActions = LazyModelAttribute.new()
    validators: ApplicationRoundValidator = LazyModelAttribute.new()

    applications: OneToManyRelatedManager[Application, ApplicationQuerySet]

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
        constraints = [
            models.CheckConstraint(
                check=models.Q(application_period_begins_at__lt=models.F("application_period_ends_at")),
                name="application_period_begin_before_end",
                violation_error_message="Application period must begin before it ends",
            ),
            models.CheckConstraint(
                check=models.Q(reservation_period_begin_date__lt=models.F("reservation_period_end_date")),
                name="reservation_period_begin_before_end",
                violation_error_message="Reservation period must begin before it ends",
            ),
            models.CheckConstraint(
                check=models.Q(public_display_begins_at__lt=models.F("public_display_ends_at")),
                name="public_display_begin_before_end",
                violation_error_message="Public display period must begin before it ends",
            ),
            models.CheckConstraint(
                check=models.Q(application_period_ends_at__date__lt=models.F("reservation_period_begin_date")),
                name="applications_end_before_reservation_period_begins",
                violation_error_message="Application period must end before reservation period begins",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(handled_at__isnull=True, sent_at__isnull=True)
                    | models.Q(handled_at__isnull=False, sent_at__isnull=True)
                    | models.Q(handled_at__lte=models.F("sent_at"))
                ),
                name="must_handle_before_sending",
                violation_error_message="Application round must be handled before it can be sent",
            ),
            models.CheckConstraint(
                check=(
                    models.Q(handled_at=None) | models.Q(application_period_ends_at__date__lt=models.F("handled_at"))
                ),
                name="handling_after_application_period_end",
                violation_error_message="Application round can only be handled after its application round has ended",
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.reservation_period_begin_date} - {self.reservation_period_end_date})"

    @lookup_property(skip_codegen=True)
    def status() -> ApplicationRoundStatusChoice:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(sent_at__isnull=False),
                then=models.Value(ApplicationRoundStatusChoice.RESULTS_SENT.value),
            ),
            models.When(
                models.Q(handled_at__isnull=False),
                then=models.Value(ApplicationRoundStatusChoice.HANDLED.value),
            ),
            models.When(
                models.Q(application_period_begins_at__gt=Now()),
                then=models.Value(ApplicationRoundStatusChoice.UPCOMING.value),
            ),
            models.When(
                models.Q(application_period_ends_at__gt=Now()),
                then=models.Value(ApplicationRoundStatusChoice.OPEN.value),
            ),
            default=models.Value(ApplicationRoundStatusChoice.IN_ALLOCATION.value),
            output_field=TextChoicesField(enum=ApplicationRoundStatusChoice),
        )

    @status.override
    def _(self) -> ApplicationRoundStatusChoice:
        now = local_datetime()
        if self.sent_at is not None:
            return ApplicationRoundStatusChoice.RESULTS_SENT
        if self.handled_at is not None:
            return ApplicationRoundStatusChoice.HANDLED
        if self.application_period_begins_at > now:
            return ApplicationRoundStatusChoice.UPCOMING
        if self.application_period_ends_at > now:
            return ApplicationRoundStatusChoice.OPEN
        return ApplicationRoundStatusChoice.IN_ALLOCATION

    @lookup_property(skip_codegen=True)
    def status_timestamp() -> datetime.datetime | None:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(sent_at__isnull=False),  # RESULTS_SENT
                then=models.F("sent_at"),
            ),
            models.When(
                models.Q(handled_at__isnull=False),  # HANDLED
                then=models.F("handled_at"),
            ),
            models.When(
                models.Q(application_period_begins_at__gt=Now()),  # UPCOMING
                then=models.F("public_display_begins_at"),
            ),
            models.When(
                models.Q(application_period_ends_at__gt=Now()),  # OPEN
                then=models.F("application_period_begins_at"),
            ),
            default=models.F("application_period_ends_at"),  # IN_ALLOCATION
            output_field=models.DateTimeField(null=True),
        )

    @status_timestamp.override
    def _(self) -> datetime.datetime | None:
        match self.status:
            case ApplicationRoundStatusChoice.UPCOMING:
                return self.public_display_begins_at
            case ApplicationRoundStatusChoice.OPEN:
                return self.application_period_begins_at
            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                return self.application_period_ends_at
            case ApplicationRoundStatusChoice.HANDLED:
                return self.handled_at
            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return self.sent_at

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
        from tilavarauspalvelu.models import ReservationSeries

        timeout = datetime.timedelta(minutes=settings.APPLICATION_ROUND_RESERVATION_CREATION_TIMEOUT_MINUTES)
        lookup = "allocated_time_slot__reservation_unit_option__application_section__application__application_round"

        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(handled_at__isnull=True),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED.value),
            ),
            models.When(
                models.Exists(ReservationSeries.objects.filter(**{lookup: models.OuterRef("id")})),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.COMPLETED.value),
            ),
            models.When(
                models.Q(handled_at__lte=Now() - timeout),
                then=models.Value(ApplicationRoundReservationCreationStatusChoice.FAILED.value),
            ),
            default=models.Value(ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED.value),
            output_field=TextChoicesField(enum=ApplicationRoundReservationCreationStatusChoice),
        )

    @reservation_creation_status.override
    def _(self) -> ApplicationRoundReservationCreationStatusChoice:
        from tilavarauspalvelu.models import ReservationSeries

        now = local_datetime()
        timeout = datetime.timedelta(minutes=settings.APPLICATION_ROUND_RESERVATION_CREATION_TIMEOUT_MINUTES)

        if self.handled_at is None:
            return ApplicationRoundReservationCreationStatusChoice.NOT_COMPLETED

        if ReservationSeries.objects.filter(
            allocated_time_slot__reservation_unit_option__application_section__application__application_round=self
        ).exists():
            return ApplicationRoundReservationCreationStatusChoice.COMPLETED

        if self.handled_at < now - timeout:
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
