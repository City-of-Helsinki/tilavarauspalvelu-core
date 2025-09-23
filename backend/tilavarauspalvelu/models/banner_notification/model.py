from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import L, lookup_property

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationState, BannerNotificationTarget
from utils.db import Now
from utils.fields.model import TextChoicesField

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
    level: BannerNotificationLevel = TextChoicesField(enum=BannerNotificationLevel)
    target: BannerNotificationTarget = TextChoicesField(enum=BannerNotificationTarget)
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

    @lookup_property
    def is_active() -> bool:
        return models.Q(  # type: ignore[return-value]
            draft=False,
            active_from__isnull=False,
            active_until__isnull=False,
            active_from__lte=Now(),
            active_until__gte=Now(),
        )

    @lookup_property
    def is_scheduled() -> bool:
        return models.Q(  # type: ignore[return-value]
            draft=False,
            active_from__isnull=False,
            active_from__gt=Now(),
        )

    @lookup_property
    def state() -> BannerNotificationState:
        return models.Case(  # type: ignore[return-value]
            models.When(
                draft=True,
                then=models.Value(BannerNotificationState.DRAFT.value),
            ),
            models.When(
                L(is_active=True),
                then=models.Value(BannerNotificationState.ACTIVE.value),
            ),
            models.When(
                L(is_scheduled=True),
                then=models.Value(BannerNotificationState.SCHEDULED.value),
            ),
            default=models.Value(BannerNotificationState.DRAFT.value),  # past notifications are considered drafts
            output_field=TextChoicesField(enum=BannerNotificationState),
        )

    @lookup_property
    def banner_level_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(
                level=BannerNotificationLevel.EXCEPTION.value,
                then=models.Value(1),
            ),
            models.When(
                level=BannerNotificationLevel.WARNING.value,
                then=models.Value(2),
            ),
            models.When(
                level=BannerNotificationLevel.NORMAL.value,
                then=models.Value(3),
            ),
            default=models.Value(4),
        )

    @lookup_property
    def banner_state_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            # Draft
            models.When(
                draft=True,
                then=models.Value(3),
            ),
            # Scheduled
            models.When(
                condition=(models.Q(active_from__gt=Now())),
                then=models.Value(2),
            ),
            # Active
            models.When(
                condition=(models.Q(active_from__lte=Now()) & models.Q(active_until__gte=Now())),
                then=models.Value(1),
            ),
            # "Past" / "draft"
            default=models.Value(4),
        )

    @lookup_property
    def banner_target_sort_order() -> int:
        return models.Case(  # type: ignore[return-value]
            models.When(
                target=BannerNotificationTarget.ALL.value,
                then=models.Value(1),
            ),
            models.When(
                target=BannerNotificationTarget.USER.value,
                then=models.Value(2),
            ),
            models.When(
                target=BannerNotificationTarget.STAFF.value,
                then=models.Value(3),
            ),
            default=models.Value(4),
        )
