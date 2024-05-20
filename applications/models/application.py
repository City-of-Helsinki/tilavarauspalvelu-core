from datetime import datetime

from django.db import models
from django.db.models.functions import Concat, Now
from django.db.models.manager import Manager
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L, lookup_property

from applications.choices import (
    ApplicantTypeChoice,
    ApplicationRoundStatusChoice,
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
)
from applications.querysets.application import ApplicationQuerySet
from common.connectors import ApplicationActionsConnector
from common.db import SubqueryArray
from common.fields.model import StrChoiceField

__all__ = [
    "Application",
]


class ApplicationManager(SerializableMixin.SerializableManager, Manager.from_queryset(ApplicationQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""


class Application(SerializableMixin, models.Model):
    """
    An application for an application round. Contains multiple application sections,
    as well as information about the applicant.
    """

    applicant_type: str = StrChoiceField(enum=ApplicantTypeChoice, null=True, db_index=True)
    created_date: datetime = models.DateTimeField(auto_now_add=True)
    last_modified_date: datetime = models.DateTimeField(auto_now=True)
    cancelled_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    sent_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    in_allocation_notification_sent_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    results_ready_notification_sent_date: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    additional_information: str | None = models.TextField(null=True, blank=True)
    working_memo: str = models.TextField(blank=True, default="")

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

    objects = ApplicationManager()
    actions = ApplicationActionsConnector()

    class Meta:
        db_table = "application"
        base_manager_name = "objects"
        verbose_name = _("Application")
        verbose_name_plural = _("Applications")
        ordering = [
            "pk",
        ]

    # For GDPR API
    serialize_fields = (
        {"name": "additional_information"},
        {"name": "application_events"},
        {"name": "application_sections"},
        {"name": "contact_person"},
        {"name": "organisation"},
        {"name": "billing_address"},
    )

    def __str__(self) -> str:
        return f"{self.user} ({self.created_date})"

    @lookup_property(joins=["application_round"], skip_codegen=True)
    def status() -> ApplicationStatusChoice:
        return models.Case(  # type: ignore[return-value]
            models.When(
                # If there is a cancelled date
                models.Q(cancelled_date__isnull=False),
                then=models.Value(ApplicationStatusChoice.CANCELLED.value),
            ),
            models.When(
                # If there is no sent date in the application
                # AND application round is upcoming or open
                (
                    models.Q(sent_date__isnull=True)
                    # NOTE: Some copy-pasta from Application Round status for efficiency
                    & models.Q(application_round__sent_date__isnull=True)
                    & models.Q(application_round__handled_date__isnull=True)
                    & models.Q(application_round__application_period_end__gt=Now())
                ),
                then=models.Value(ApplicationStatusChoice.DRAFT.value),
            ),
            models.When(
                # If there is no sent date in the application
                # (and the application round has moved on according to the previous cases)
                models.Q(sent_date__isnull=True),
                then=models.Value(ApplicationStatusChoice.EXPIRED.value),
            ),
            # NOTE: Some copy-pasta from Application Round status for efficiency
            models.When(
                # If the application round has been marked as sent
                models.Q(application_round__sent_date__isnull=False),
                then=models.Value(ApplicationStatusChoice.RESULTS_SENT.value),
            ),
            models.When(
                # If the application round has been marked as handled
                models.Q(application_round__handled_date__isnull=False),
                then=models.Value(ApplicationStatusChoice.HANDLED.value),
            ),
            models.When(
                # If the application round application period has not ended
                models.Q(application_round__application_period_end__gt=Now()),
                then=models.Value(ApplicationStatusChoice.RECEIVED.value),
            ),
            models.When(
                # If not all sections are done allocating
                models.Q(L(all_sections_allocated=False)),
                then=models.Value(ApplicationStatusChoice.IN_ALLOCATION.value),
            ),
            default=models.Value(ApplicationStatusChoice.HANDLED.value),
            output_field=models.CharField(),
        )

    @status.override
    def _(self) -> ApplicationStatusChoice:
        if self.cancelled_date is not None:
            return ApplicationStatusChoice.CANCELLED

        if self.sent_date is None:
            if self.application_round.status.is_allocation_upcoming:
                return ApplicationStatusChoice.DRAFT
            return ApplicationStatusChoice.EXPIRED

        match self.application_round.status:
            case ApplicationRoundStatusChoice.UPCOMING | ApplicationRoundStatusChoice.OPEN:
                return ApplicationStatusChoice.RECEIVED

            case ApplicationRoundStatusChoice.IN_ALLOCATION:
                if not self.all_sections_allocated:
                    return ApplicationStatusChoice.IN_ALLOCATION
                return ApplicationStatusChoice.HANDLED

            case ApplicationRoundStatusChoice.HANDLED:
                return ApplicationStatusChoice.HANDLED

            case ApplicationRoundStatusChoice.RESULTS_SENT:
                return ApplicationStatusChoice.RESULTS_SENT

    @lookup_property(joins=["application_sections"], skip_codegen=True)
    def all_sections_allocated() -> bool:
        from applications.models import ApplicationSection

        return ~models.Exists(  # type: ignore[return-value]
            ApplicationSection.objects.alias(status=L("status")).filter(
                application=models.OuterRef("pk"),
                status__in=[
                    ApplicationSectionStatusChoice.UNALLOCATED.value,
                    ApplicationSectionStatusChoice.IN_ALLOCATION.value,
                ],
            )
        )

    @all_sections_allocated.override
    def _(self) -> bool:
        return (
            not self.application_sections.alias(status=L("status"))
            .filter(
                status__in=[
                    ApplicationSectionStatusChoice.UNALLOCATED.value,
                    ApplicationSectionStatusChoice.IN_ALLOCATION.value,
                ]
            )
            .exists()
        )

    @lookup_property(joins=["organisation", "contact_person", "user"], skip_codegen=True)
    def applicant() -> str:
        return models.Case(  # type: ignore[return-value]
            models.When(
                models.Q(organisation__isnull=False),
                then=models.F("organisation__name"),
            ),
            models.When(
                models.Q(contact_person__isnull=False),
                then=Concat(
                    "contact_person__first_name",
                    models.Value(" "),
                    "contact_person__last_name",
                ),
            ),
            models.When(
                models.Q(user__isnull=False),
                then=Concat(
                    "user__first_name",
                    models.Value(" "),
                    "user__last_name",
                ),
            ),
            default=models.Value(""),
            output_field=models.CharField(),
        )

    @applicant.override
    def _(self) -> str:
        if self.organisation is not None:
            return self.organisation.name
        if self.contact_person is not None:
            return f"{self.contact_person.first_name} {self.contact_person.last_name}"
        if self.user is not None:
            return f"{self.user.first_name} {self.user.last_name}"
        return ""

    @lookup_property
    def status_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(models.Q(L(status=ApplicationStatusChoice.DRAFT.value)), then=models.Value(1)),
            models.When(models.Q(L(status=ApplicationStatusChoice.CANCELLED.value)), then=models.Value(2)),
            models.When(models.Q(L(status=ApplicationStatusChoice.EXPIRED.value)), then=models.Value(3)),
            models.When(models.Q(L(status=ApplicationStatusChoice.RECEIVED.value)), then=models.Value(4)),
            models.When(models.Q(L(status=ApplicationStatusChoice.IN_ALLOCATION.value)), then=models.Value(5)),
            models.When(models.Q(L(status=ApplicationStatusChoice.HANDLED.value)), then=models.Value(6)),
            models.When(models.Q(L(status=ApplicationStatusChoice.RESULTS_SENT.value)), then=models.Value(7)),
            default=models.Value(8),
            output_field=models.IntegerField(),
        )

    @lookup_property
    def applicant_type_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(models.Q(applicant_type=ApplicantTypeChoice.ASSOCIATION.value), then=models.Value(1)),
            models.When(models.Q(applicant_type=ApplicantTypeChoice.COMMUNITY.value), then=models.Value(2)),
            models.When(models.Q(applicant_type=ApplicantTypeChoice.INDIVIDUAL.value), then=models.Value(3)),
            models.When(models.Q(applicant_type=ApplicantTypeChoice.COMPANY.value), then=models.Value(4)),
            default=models.Value(5),
            output_field=models.IntegerField(),
        )

    @property
    def units(self):
        from spaces.models import Unit

        from .reservation_unit_option import ReservationUnitOption

        qs = ReservationUnitOption.objects.filter(application_section__application=self)
        ids = qs.values("reservation_unit")
        return Unit.objects.filter(reservationunit__in=models.Subquery(ids))

    @lookup_property(joins=["application_sections"], skip_codegen=True)
    def unit_ids_for_perms() -> list[int]:
        from spaces.models import Unit

        ref = "application_sections__reservation_unit_options__reservation_unit"
        expr = SubqueryArray(Unit.objects.filter(reservationunit__in=models.OuterRef(ref)).values("id"), agg_field="id")
        return expr  # type: ignore[return-value]

    @unit_ids_for_perms.override
    def _(self) -> list[int]:
        return [unit.id for unit in self.units]

    @lookup_property(joins=["application_sections"], skip_codegen=True)
    def unit_group_ids_for_perms() -> list[int]:
        from spaces.models import UnitGroup

        ref = "application_sections__reservation_unit_options__reservation_unit__unit"
        expr = SubqueryArray(UnitGroup.objects.filter(units__in=models.OuterRef(ref)).values("id"), agg_field="id")
        return expr  # type: ignore[return-value]

    @unit_group_ids_for_perms.override
    def _(self) -> list[int]:
        from spaces.models import UnitGroup

        from .reservation_unit_option import ReservationUnitOption

        qs = ReservationUnitOption.objects.filter(application_section__application=self)
        ids = qs.values("reservation_unit__unit")
        return list(UnitGroup.objects.filter(units__in=models.Subquery(ids)).values_list("id", flat=True))
