from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationState, BannerNotificationTarget
from utils.date_utils import local_datetime
from utils.fields.model import StrChoiceField
from utils.lazy import LazyModelAttribute, LazyModelManager

from .queryset import BANNER_LEVEL_SORT_ORDER, BANNER_TARGET_SORT_ORDER

if TYPE_CHECKING:
    import datetime

    from .actions import BannerNotificationActions
    from .queryset import BannerNotificationManager
    from .validators import BannerNotificationValidator


__all__ = [
    "BannerNotification",
]


class BannerNotification(models.Model):
    name: str = models.CharField(max_length=100, unique=True)
    message: str = models.TextField(max_length=1_000, blank=True, default="")
    draft: bool = models.BooleanField(default=True)
    level: str = StrChoiceField(enum=BannerNotificationLevel)
    target: str = StrChoiceField(enum=BannerNotificationTarget)
    active_from: datetime.datetime | None = models.DateTimeField(null=True, blank=True, default=None)
    active_until: datetime.datetime | None = models.DateTimeField(null=True, blank=True, default=None)

    # Translated field hints
    message_fi: str | None
    message_sv: str | None
    message_en: str | None

    objects: ClassVar[BannerNotificationManager] = LazyModelManager.new()
    actions: BannerNotificationActions = LazyModelAttribute.new()
    validators: BannerNotificationValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "banner_notification"
        base_manager_name = "objects"
        verbose_name = _("banner notification")
        verbose_name_plural = _("banner notifications")
        ordering = ["pk"]
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
                violation_error_message=_("Non-draft notifications must have an active period and message set."),
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
                violation_error_message=_(
                    "Both 'active_from' and 'active_until' must be either empty or set. "
                    "If both are set, 'active_until' must be after 'active_from'."
                ),
            ),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def is_active(self) -> bool:
        if self.draft or self.active_from is None or self.active_until is None:
            return False

        return self.active_from <= local_datetime() <= self.active_until

    @property
    def is_scheduled(self) -> bool:
        if self.draft or self.active_from is None or self.active_until is None:
            return False

        return self.active_from > local_datetime()

    @property
    def state(self) -> BannerNotificationState:
        if self.draft:
            return BannerNotificationState.DRAFT
        if self.is_active:
            return BannerNotificationState.ACTIVE
        if self.is_scheduled:
            return BannerNotificationState.SCHEDULED
        return BannerNotificationState.DRAFT  # past notifications are considered drafts
