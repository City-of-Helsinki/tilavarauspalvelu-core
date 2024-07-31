from django.db import models
from django.utils.translation import pgettext_lazy


class BannerNotificationLevel(models.TextChoices):
    EXCEPTION = "EXCEPTION", pgettext_lazy("BannerNotificationLevel", "Exception")
    WARNING = "WARNING", pgettext_lazy("BannerNotificationLevel", "Warning")
    NORMAL = "NORMAL", pgettext_lazy("BannerNotificationLevel", "Normal")


class BannerNotificationTarget(models.TextChoices):
    ALL = "ALL", pgettext_lazy("BannerNotificationTarget", "All")
    STAFF = "STAFF", pgettext_lazy("BannerNotificationTarget", "Staff")
    USER = "USER", pgettext_lazy("BannerNotificationTarget", "User")


class BannerNotificationState(models.TextChoices):
    DRAFT = "DRAFT", pgettext_lazy("BannerNotificationState", "Draft")
    SCHEDULED = "SCHEDULED", pgettext_lazy("BannerNotificationState", "Scheduled")
    ACTIVE = "ACTIVE", pgettext_lazy("BannerNotificationState", "Active")
