import datetime

from django.db import models
from django.utils.text import format_lazy
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from applications.choices import OrganizationTypeChoice
from common.fields.model import StrChoiceField

__all__ = [
    "Organisation",
]


DEFAULT_TIMEZONE = get_default_timezone()


def year_not_in_future(year: int | None) -> None:
    if year is None:
        return

    current_date = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

    if current_date.year < year:
        msg = _("is after current year")
        raise ValidationError(format_lazy("{year} {msg}", year=year, msg=msg))


class Organisation(models.Model):
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
        "applications.Address",
        null=True,
        blank=False,
        on_delete=models.SET_NULL,
        related_name="organisations",
    )

    # Translated field hints
    core_business_fi: str | None
    core_business_en: str | None
    core_business_sv: str | None

    def __str__(self) -> str:
        return self.name
