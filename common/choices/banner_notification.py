from django.db import models
from django.utils.translation import gettext_lazy as _


class BannerNotificationLevel(models.TextChoices):
    EXCEPTION = "EXCEPTION", _("Exception")
    WARNING = "WARNING", _("Warning")
    NORMAL = "NORMAL", _("Normal")


class BannerNotificationTarget(models.TextChoices):
    ALL = "ALL", _("All")
    STAFF = "STAFF", _("Staff")
    USER = "USER", _("User")


class BannerNotificationState(models.TextChoices):
    DRAFT = "DRAFT", _("Draft")
    SCHEDULED = "SCHEDULED", _("Scheduled")
    ACTIVE = "ACTIVE", _("Active")
