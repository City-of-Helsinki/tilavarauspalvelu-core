from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar, override

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from waffle.models import AbstractUserFlag

from utils.date_utils import utc_datetime

if TYPE_CHECKING:
    import datetime

    from django.http import HttpRequest
    from lazy_managers import LazyAttribute

    from .actions import FeatureFlagActions
    from .queryset import FeatureFlagManager
    from .validators import FeatureFlagValidator


__all__ = [
    "FeatureFlag",
]


class FeatureFlag(AbstractUserFlag):
    active_for_everyone_from: datetime.datetime | None = models.DateTimeField(
        null=True,
        blank=True,
        default=None,
        verbose_name=_("Active for everyone from"),
        help_text=_(
            "From this time, the flag is on for every user. Before this time, the other rules decide. "
            "'Everyone: No' turns the flag off even after this time."
        ),
    )

    objects: ClassVar[FeatureFlagManager] = LazyModelManager.new()
    actions: LazyAttribute[FeatureFlagActions] = LazyModelAttribute.new()
    validators: LazyAttribute[FeatureFlagValidator] = LazyModelAttribute.new()

    class Meta(AbstractUserFlag.Meta):
        db_table = "feature_flag"
        base_manager_name = "objects"
        verbose_name = _("feature flag")
        verbose_name_plural = _("feature flags")
        ordering = ["pk"]

    @override
    def is_active(self, request: HttpRequest, read_only: bool = False) -> bool | None:
        # 'Everyone: No' is the way to turn a feature off quickly, so it must win over the start time.
        if self.pk is not None and self.everyone is not False and self.active_for_everyone_from is not None:
            now = utc_datetime()
            if self.active_for_everyone_from <= now:
                return True

        return super().is_active(request, read_only=read_only)
