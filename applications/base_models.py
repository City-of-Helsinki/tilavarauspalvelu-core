from django.db import models
from django.utils.translation import gettext_lazy as _


class ContactInformation(models.Model):
    email = models.EmailField(
        verbose_name=_("Email"),
        null=True,
        blank=True,
    )

    phone_number = models.TextField(
        verbose_name=_("Phone number"),
        null=True,
        blank=True,
        max_length=50,
    )

    class Meta:
        abstract = True
