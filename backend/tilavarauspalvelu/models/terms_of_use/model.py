from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import pgettext_lazy
from django_nh3.models import Nh3Field
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import TermsOfUseTypeChoices
from utils.auditlog_util import AuditLogger
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound, ReservationUnit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.application_round.queryset import ApplicationRoundQuerySet
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

    from .actions import TermsOfUseActions
    from .queryset import TermsOfUseManager
    from .validators import TermsOfUseValidator

__all__ = [
    "TermsOfUse",
]


class TermsOfUse(models.Model):
    id: str = models.CharField(primary_key=True, max_length=100)
    name: str | None = models.CharField(max_length=255, null=True, blank=True)  # noqa: DJ001

    text: str = Nh3Field(
        tags=settings.NH3_ALLOWED_TAGS,
        attributes=settings.NH3_ALLOWED_ATTRIBUTES,
    )

    terms_type: TermsOfUseTypeChoices = TextChoicesField(
        enum=TermsOfUseTypeChoices,
        default=TermsOfUseTypeChoices.GENERIC,
        blank=False,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    text_fi: str | None
    text_en: str | None
    text_sv: str | None

    objects: ClassVar[TermsOfUseManager] = LazyModelManager.new()
    actions: TermsOfUseActions = LazyModelAttribute.new()
    validators: TermsOfUseValidator = LazyModelAttribute.new()

    application_rounds: OneToManyRelatedManager[ApplicationRound, ApplicationRoundQuerySet]
    cancellation_terms_reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]
    service_specific_terms_reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]
    pricing_terms_reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]
    payment_terms_reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "terms_of_use"
        base_manager_name = "objects"
        verbose_name = pgettext_lazy("singular", "terms of use")
        verbose_name_plural = pgettext_lazy("plural", "terms of use")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name


AuditLogger.register(TermsOfUse)
