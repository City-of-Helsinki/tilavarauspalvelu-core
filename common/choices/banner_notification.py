from django.db import models
from django.utils.translation import gettext_lazy


class BannerNotificationType(models.TextChoices):
    EXCEPTION = "EXCEPTION", gettext_lazy("Exception")
    WARNING = "WARNING", gettext_lazy("Warning")
    NORMAL = "NORMAL", gettext_lazy("Normal")


class BannerNotificationTarget(models.TextChoices):
    ALL = "ALL", gettext_lazy("All")
    STAFF = "STAFF", gettext_lazy("Staff")
    USER = "USER", gettext_lazy("User")


class BannerNotificationState(models.TextChoices):
    DRAFT = "DRAFT", gettext_lazy("Draft")
    SCHEDULED = "SCHEDULED", gettext_lazy("Scheduled")
    ACTIVE = "ACTIVE", gettext_lazy("Active")
