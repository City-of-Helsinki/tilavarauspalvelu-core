from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.db.models.functions import Concat
from django.utils.translation import gettext_lazy as _
from django_nh3.models import Nh3Field
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import (
    ApplicationRoundStatusChoice,
    ApplicationSectionStatusChoice,
    ApplicationStatusChoice,
    MunicipalityChoice,
    ReserveeType,
)
from utils.db import Now
from utils.fields.model import TextChoicesField
from utils.mixins import SerializableModelMixin

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ApplicationRound, ApplicationSection, Unit, User
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.application_section.queryset import ApplicationSectionQuerySet

    from .actions import ApplicationActions
    from .queryset import ApplicationManager
    from .validators import ApplicationValidator


__all__ = [
    "Application",
]


class Application(SerializableModelMixin, models.Model):
    """
    An application for an application round. Contains multiple application sections,
    as well as information about the applicant.
    """

    # Basic information
    applicant_type: ReserveeType | None = TextChoicesField(enum=ReserveeType, null=True, blank=True)
    additional_information: str = Nh3Field(blank=True, default="")

    # Handling data
    cancelled_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    sent_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    working_memo: str = Nh3Field(blank=True, default="")

    # Email notification flags
    in_allocation_notification_sent_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)
    results_ready_notification_sent_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    # Contact person data
    contact_person_first_name: str = models.CharField(max_length=255, blank=True, default="")
    contact_person_last_name: str = models.CharField(max_length=255, blank=True, default="")
    contact_person_email: str | None = models.EmailField(null=True, blank=True)  # noqa: DJ001
    contact_person_phone_number: str = models.CharField(max_length=255, blank=True, default="")

    # Billing address
    billing_street_address: str = models.CharField(max_length=255, blank=True, default="")
    billing_post_code: str = models.CharField(max_length=255, blank=True, default="")
    billing_city: str = models.CharField(max_length=255, blank=True, default="")

    # Organisation data
    organisation_name: str = models.CharField(max_length=255, blank=True, default="")
    organisation_email: str | None = models.EmailField(null=True, blank=True)  # noqa: DJ001
    organisation_identifier: str = models.CharField(max_length=255, blank=True, default="")
    organisation_year_established: int | None = models.PositiveIntegerField(null=True, blank=True)
    organisation_active_members: int | None = models.PositiveIntegerField(null=True, blank=True)
    organisation_core_business: str = Nh3Field(blank=True, default="")
    organisation_street_address: str = models.CharField(max_length=255, blank=True, default="")
    organisation_post_code: str = models.CharField(max_length=255, blank=True, default="")
    organisation_city: str = models.CharField(max_length=255, blank=True, default="")
    municipality: MunicipalityChoice | None = TextChoicesField(enum=MunicipalityChoice, null=True, blank=True)

    # Auto-filled fields
    created_at: datetime.datetime = models.DateTimeField(auto_now_add=True)
    updated_at: datetime.datetime = models.DateTimeField(auto_now=True)

    application_round: ApplicationRound = models.ForeignKey(
        "tilavarauspalvelu.ApplicationRound",
        related_name="applications",
        on_delete=models.PROTECT,
    )
    user: User = models.ForeignKey(
        "tilavarauspalvelu.User",
        related_name="applications",
        on_delete=models.PROTECT,
    )

    objects: ClassVar[ApplicationManager] = LazyModelManager.new()
    actions: ApplicationActions = LazyModelAttribute.new()
    validators: ApplicationValidator = LazyModelAttribute.new()

    application_sections: OneToManyRelatedManager[ApplicationSection, ApplicationSectionQuerySet]

    class Meta:
        db_table = "application"
        base_manager_name = "objects"
        verbose_name = _("application")
        verbose_name_plural = _("applications")
        ordering = ["pk"]

    # For GDPR API
    serialize_fields = (
        {"name": "additional_information"},
        {"name": "contact_person_first_name"},
        {"name": "contact_person_last_name"},
        {"name": "contact_person_email"},
        {"name": "contact_person_phone_number"},
        {"name": "billing_street_address"},
        {"name": "billing_post_code"},
        {"name": "billing_city"},
        {"name": "organisation_name"},
        {"name": "organisation_identifier"},
        {"name": "organisation_email"},
        {"name": "organisation_core_business"},
        {"name": "organisation_street_address"},
        {"name": "organisation_post_code"},
        {"name": "organisation_city"},
        {"name": "application_sections"},
    )

    def __str__(self) -> str:
        return f"{self.user} ({self.created_at.date()})"

    @lookup_property(joins=["application_round"], skip_codegen=True)
    def status() -> ApplicationStatusChoice:
        return models.Case(  # type: ignore[return-value]
            models.When(
                # If there is a cancelled date
                models.Q(cancelled_at__isnull=False),
                then=models.Value(ApplicationStatusChoice.CANCELLED.value),
            ),
            models.When(
                # If there is no sent date in the application
                # AND application round is upcoming or open
                (
                    models.Q(sent_at__isnull=True)
                    # NOTE: Some copy-pasta from Application Round status for efficiency
                    & models.Q(application_round__sent_at__isnull=True)
                    & models.Q(application_round__handled_at__isnull=True)
                    & models.Q(application_round__application_period_ends_at__gt=Now())
                ),
                then=models.Value(ApplicationStatusChoice.DRAFT.value),
            ),
            models.When(
                # If there is no sent date in the application
                # (and the application round has moved on according to the previous cases)
                models.Q(sent_at__isnull=True),
                then=models.Value(ApplicationStatusChoice.EXPIRED.value),
            ),
            # NOTE: Some copy-pasta from `ApplicationRound.status` for efficiency
            models.When(
                # If the application round has been marked as sent
                models.Q(application_round__sent_at__isnull=False),
                then=models.Value(ApplicationStatusChoice.RESULTS_SENT.value),
            ),
            models.When(
                # If the application round has been marked as handled
                models.Q(application_round__handled_at__isnull=False),
                then=models.Value(ApplicationStatusChoice.HANDLED.value),
            ),
            models.When(
                # If the application round application period has not ended
                models.Q(application_round__application_period_ends_at__gt=Now()),
                then=models.Value(ApplicationStatusChoice.RECEIVED.value),
            ),
            models.When(
                # If not all sections are done allocating
                models.Q(L(all_sections_allocated=False)),
                then=models.Value(ApplicationStatusChoice.IN_ALLOCATION.value),
            ),
            default=models.Value(ApplicationStatusChoice.HANDLED.value),
            output_field=TextChoicesField(enum=ApplicationStatusChoice),
        )

    @status.override
    def _(self) -> ApplicationStatusChoice:
        if self.cancelled_at is not None:
            return ApplicationStatusChoice.CANCELLED

        if self.sent_at is None:
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

            case _:
                msg = f"Unknown application round status: {self.status}"
                raise ValueError(msg)

    @lookup_property(skip_codegen=True)
    def all_sections_allocated() -> bool:
        from tilavarauspalvelu.models import ApplicationSection

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

    @lookup_property
    def applicant() -> str:
        return models.Case(  # type: ignore[return-value]
            models.When(
                ~models.Q(organisation_name=""),
                then=models.F("organisation_name"),
            ),
            models.When(
                (~models.Q(contact_person_first_name="") & ~models.Q(contact_person_last_name="")),
                then=Concat("contact_person_first_name", models.Value(" "), "contact_person_last_name"),
            ),
            models.When(
                (~models.Q(user__first_name="") & ~models.Q(user__last_name="")),
                then=Concat("user__first_name", models.Value(" "), "user__last_name"),
            ),
            default=models.Value(""),
            output_field=models.CharField(),
        )

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
            models.When(models.Q(applicant_type=ReserveeType.NONPROFIT.value), then=models.Value(1)),
            models.When(models.Q(applicant_type=ReserveeType.INDIVIDUAL.value), then=models.Value(2)),
            models.When(models.Q(applicant_type=ReserveeType.COMPANY.value), then=models.Value(3)),
            default=models.Value(4),
            output_field=models.IntegerField(),
        )

    @property
    def units_for_permissions(self) -> list[Unit]:
        from tilavarauspalvelu.models import Unit

        if hasattr(self, "_units_for_permissions"):
            return self._units_for_permissions

        self._units_for_permissions = list(
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservation_units__reservation_unit_options__application_section__application=self)
            .distinct()
        )
        return self._units_for_permissions

    @units_for_permissions.setter
    def units_for_permissions(self, value: list[Unit]) -> None:
        # The setter is used by ApplicationQuerySet to pre-evaluate units for multiple Applications.
        # Should not be used by anything else!
        self._units_for_permissions = value

    @property
    def full_billing_address(self) -> str:
        return f"{self.billing_street_address}, {self.billing_post_code} {self.billing_city}"

    @property
    def full_organisation_address(self) -> str:
        return f"{self.organisation_street_address}, {self.organisation_post_code} {self.organisation_city}"
