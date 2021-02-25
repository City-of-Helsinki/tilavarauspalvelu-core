from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _
from helusers.models import AbstractUser


class User(AbstractUser):
    preferred_language = models.CharField(
        max_length=8,
        null=True,
        blank=True,
        verbose_name=_("Preferred UI language"),
        choices=settings.LANGUAGES,
    )

    def get_display_name(self):
        return "{0} {1}".format(self.first_name, self.last_name).strip()

    def get_preferred_language(self):
        if not self.preferred_language:
            return settings.LANGUAGES[0][0]
        else:
            return self.preferred_language
