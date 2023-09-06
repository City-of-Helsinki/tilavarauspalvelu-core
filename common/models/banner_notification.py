from datetime import datetime

from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy

from common.choices import BannerNotificationLevel, BannerNotificationState, BannerNotificationTarget
from common.fields import ChoiceField
from common.querysets import BannerNotificationQuerySet
from common.querysets.banner_notification import BANNER_LEVEL_SORT_ORDER, BANNER_TARGET_SORT_ORDER


class BannerNotification(models.Model):
    name: str = models.CharField(max_length=100, null=False, blank=False, unique=True)
    message: str = models.TextField(max_length=1_000, blank=True, default="")
    draft: bool = models.BooleanField(default=True)
    level: str = ChoiceField(choices=BannerNotificationLevel.choices)
    target: str = ChoiceField(choices=BannerNotificationTarget.choices)
    active_from: datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    active_until: datetime | None = models.DateTimeField(null=True, blank=True, default=None)

    objects = BannerNotificationQuerySet.as_manager()

    @property
    def is_active(self) -> bool:
        if self.draft or self.active_from is None or self.active_until is None:
            return False

        now = timezone.now()
        return self.active_from <= now <= self.active_until

    @property
    def is_scheduled(self) -> bool:
        if self.draft or self.active_from is None or self.active_until is None:
            return False

        return self.active_from > timezone.now()

    @property
    def state(self) -> BannerNotificationState:
        if self.draft:
            return BannerNotificationState.DRAFT
        if self.is_active:
            return BannerNotificationState.ACTIVE
        if self.is_scheduled:
            return BannerNotificationState.SCHEDULED
        return BannerNotificationState.DRAFT  # past notifications are considered drafts

    class Meta:
        db_table = "banner_notification"
        base_manager_name = "objects"
        indexes = [
            models.Index(
                BANNER_LEVEL_SORT_ORDER,
                name="level_priority_index",
            ),
            models.Index(
                BANNER_TARGET_SORT_ORDER,
                name="target_priority_index",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                name="non_draft_notifications_must_have_active_period_and_message",
                check=(
                    models.Q(draft=True)
                    | (
                        models.Q(draft=False)
                        & models.Q(active_from__isnull=False)
                        & models.Q(active_until__isnull=False)
                        & ~models.Q(message="")
                    )
                ),
                violation_error_message=gettext_lazy(
                    "Non-draft notifications must have an active period and message set."
                ),
            ),
            models.CheckConstraint(
                name="active_period_not_set_or_active_until_after_active_from",
                check=(
                    (models.Q(active_from__isnull=True) & models.Q(active_until__isnull=True))
                    | (
                        models.Q(active_from__isnull=False)
                        & models.Q(active_until__isnull=False)
                        & models.Q(active_until__gt=models.F("active_from"))
                    )
                ),
                violation_error_message=gettext_lazy(
                    "Both 'active_from' and 'active_until' must be either empty or set. "
                    "If both are set, 'active_until' must be after 'active_from'."
                ),
            ),
        ]

    def __str__(self) -> str:
        return self.name
