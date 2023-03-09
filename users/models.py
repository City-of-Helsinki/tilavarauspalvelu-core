import uuid

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from helusers.models import AbstractUser


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class User(AbstractUser):
    tvp_uuid = models.UUIDField(
        default=uuid.uuid4, null=False, editable=False, unique=True
    )
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

    date_of_birth = models.DateField(verbose_name=_("Date of birth"), null=True)

    profile_id = models.CharField(max_length=255, null=False, blank=True, default="")

    def get_display_name(self):
        return "{0} {1}".format(self.first_name, self.last_name).strip()

    def get_preferred_language(self):
        if not self.preferred_language:
            return settings.LANGUAGES[0][0]
        else:
            return self.preferred_language


class PersonalInfoViewLog(models.Model):
    field = models.CharField(max_length=255, null=False, blank=False, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="personal_info_view_logs",
        editable=False,
    )
    viewer_username = models.CharField(max_length=255)
    viewer_user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="as_viewer_personal_info_view_logs",
        editable=False,
    )
    access_time = models.DateTimeField(auto_now=True, editable=False)
    viewer_user_email = models.CharField(max_length=255, default="", blank=True)
    viewer_user_full_name = models.CharField(max_length=255, default="", blank=True)
