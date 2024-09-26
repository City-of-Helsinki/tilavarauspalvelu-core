from __future__ import annotations

import datetime
from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from rest_framework.exceptions import ValidationError

from common.date_utils import DEFAULT_TIMEZONE
from common.fields.model import StrChoiceField
from tilavarauspalvelu.enums import OrganizationTypeChoice

from .queryset import OrganisationQuerySet

if TYPE_CHECKING:
    from .actions import OrganisationActions

__all__ = [
    "Organisation",
]


def year_not_in_future(year: int | None) -> None:
    if year is None:
        return

    current_date = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

    if current_date.year < year:
        msg = _("is after current year")
        raise ValidationError(format_lazy("{year} {msg}", year=year, msg=msg))


class Organisation(SerializableMixin, models.Model):
    name: str = models.CharField(null=False, blank=False, max_length=255)
    email: str = models.EmailField(default="", blank=True)
    identifier: str | None = models.CharField(null=True, blank=False, max_length=255, unique=False)
    year_established: int | None = models.PositiveIntegerField(validators=[year_not_in_future], null=True, blank=True)
    active_members: int | None = models.PositiveIntegerField(null=True, blank=False)
    core_business: str = models.TextField(blank=True)

    organisation_type: OrganizationTypeChoice = StrChoiceField(
        enum=OrganizationTypeChoice,
        default=OrganizationTypeChoice.COMPANY,
    )

    address = models.ForeignKey(
        "tilavarauspalvelu.Address",
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
        related_name="organisations",
    )

    # Translated field hints
    core_business_fi: str | None
    core_business_en: str | None
    core_business_sv: str | None

    objects = OrganisationQuerySet.as_manager()

    class Meta:
        db_table = "organisation"
        base_manager_name = "objects"
        verbose_name = _("Organisation")
        verbose_name_plural = _("Organisations")
        ordering = ["pk"]

    # For GDPR API
    serialize_fields = (
        {"name": "name"},
        {"name": "identifier"},
        {"name": "email"},
        {"name": "core_business"},
        {"name": "core_business_fi"},
        {"name": "core_business_en"},
        {"name": "core_business_sv"},
        {"name": "address"},
    )

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> OrganisationActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import OrganisationActions

        return OrganisationActions(self)
