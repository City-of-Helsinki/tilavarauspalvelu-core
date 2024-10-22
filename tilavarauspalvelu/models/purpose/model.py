from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

from .queryset import PurposeManager

if TYPE_CHECKING:
    from easy_thumbnails.files import ThumbnailFile

    from .actions import PurposeActions


__all__ = [
    "Purpose",
]


class Purpose(models.Model):
    name: str = models.CharField(max_length=200)
    rank: int | None = models.PositiveIntegerField(blank=True, null=True)

    image: ThumbnailFile | None
    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT, null=True)

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects = PurposeManager()

    class Meta:
        db_table = "purpose"
        base_manager_name = "objects"
        verbose_name = _("purpose")
        verbose_name_plural = _("purposes")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        from tilavarauspalvelu.utils.image_purge import purge_previous_image_cache

        purge_previous_image_cache(self)
        super().save(*args, **kwargs)

    @cached_property
    def actions(self) -> PurposeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PurposeActions

        return PurposeActions(self)
