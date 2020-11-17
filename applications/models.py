import datetime
from typing import Optional

from django.db import models
from django.contrib.auth.models import User
from django.utils.text import format_lazy
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError

from applications.base_models import ContactInformation


def year_not_in_future(year: Optional[int]):
    if year is None:
        return

    current_date = datetime.datetime.now()

    if current_date.year < year:
        msg = _("is before current year")
        raise ValidationError(format_lazy("{year} {msg}", year=year, msg=msg))


class Address(models.Model):
    street_address = models.TextField(
        verbose_name=_("Street address"), null=False, blank=False, max_length=80
    )

    post_code = models.PositiveIntegerField(
        verbose_name=_("Post code"),
        null=False,
        blank=False,
    )

    city = models.TextField(
        verbose_name=_("City"), null=False, blank=False, max_length=80
    )


class Person(ContactInformation):

    first_name = models.TextField(
        verbose_name=_("First name"), null=False, blank=False, max_length=50
    )

    last_name = models.TextField(
        verbose_name=_("Last name"), null=False, blank=False, max_length=50
    )


class Organisation(models.Model):

    name = models.TextField(
        verbose_name=_("Name"),
        null=False,
        blank=False,
        max_length=255,
    )

    identifier = models.TextField(
        verbose_name=_("Organisation identifier"),
        null=False,
        blank=False,
        max_length=255,
        unique=True,
    )

    year_established = (
        models.PositiveIntegerField(
            verbose_name=_("Year established"),
            validators=[year_not_in_future],
            null=True,
            blank=True,
        ),
    )

    address = models.ForeignKey(
        Address, null=True, blank=True, on_delete=models.SET_NULL
    )


class Application(models.Model):

    description = models.fields.TextField(
        verbose_name=_("Description"), max_length=1000, blank=True, null=True
    )

    reservation_purpose = models.ForeignKey(
        to="reservations.ReservationPurpose",
        verbose_name=_("Purpose"),
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    organisation = models.ForeignKey(
        Organisation,
        verbose_name=_("Organisation"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )

    contact_person = models.ForeignKey(
        Person,
        verbose_name=_("Contact person"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )

    user = models.ForeignKey(
        User,
        verbose_name=_("Applicant"),
        null=False,
        blank=False,
        on_delete=models.PROTECT,
    )
