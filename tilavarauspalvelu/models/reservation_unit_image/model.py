from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import models
from easy_thumbnails.fields import ThumbnailerImageField

from tilavarauspalvelu.enums import ReservationUnitImageType

from .queryset import ReservationUnitImageQuerySet

if TYPE_CHECKING:
    from easy_thumbnails.files import ThumbnailFile

    from .actions import ReservationUnitImageActions

__all__ = [
    "ReservationUnitImage",
]


class ReservationUnitImage(models.Model):
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="images",
        on_delete=models.CASCADE,
    )

    image: ThumbnailFile | None
    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT, null=True)
    image_type: str = models.CharField(max_length=20, choices=ReservationUnitImageType.choices)

    large_url: str = models.URLField(max_length=255, default="", blank=True)
    medium_url: str = models.URLField(max_length=255, default="", blank=True)
    small_url: str = models.URLField(max_length=255, default="", blank=True)

    objects = ReservationUnitImageQuerySet.as_manager()

    class Meta:
        db_table = "reservation_unit_image"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.reservation_unit.name} ({self.get_image_type_display()})"

    def save(self, *args: Any, **kwargs: Any) -> None:
        from tilavarauspalvelu.utils.image_purge import purge_previous_image_cache

        purge_previous_image_cache(self)

        run_update_urls = bool(kwargs.pop("update_urls", True))
        super().save(*args, **kwargs)

        if run_update_urls:
            from tilavarauspalvelu.tasks import update_urls

            update_urls.delay(self.pk)

    @cached_property
    def actions(self) -> ReservationUnitImageActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitImageActions

        return ReservationUnitImageActions(self)
