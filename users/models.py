from django.conf import settings
from django.db import models
from django.utils.translation import ugettext_lazy as _
from helusers.models import AbstractUser


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class User(AbstractUser):
    preferred_language = models.CharField(
        max_length=8,
        null=True,
        blank=True,
        verbose_name=_("Preferred UI language"),
        choices=settings.LANGUAGES,
    )

    reservation_notification = models.CharField(
        max_length=32,
        verbose_name=_("Reservation notification"),
        choices=ReservationNotification.choices,
        blank=False,
        null=False,
        default=ReservationNotification.NONE,
        help_text="When user wants to receive reservation notification emails.",
    )

    def get_display_name(self):
        return "{0} {1}".format(self.first_name, self.last_name).strip()

    def get_preferred_language(self):
        if not self.preferred_language:
            return settings.LANGUAGES[0][0]
        else:
            return self.preferred_language
