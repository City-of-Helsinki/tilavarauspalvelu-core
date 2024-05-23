from typing import Any

from django.conf import settings
from django.db import models
from easy_thumbnails.fields import ThumbnailerImageField
from easy_thumbnails.files import ThumbnailFile

from reservation_units.enums import ReservationUnitImageType
from reservation_units.tasks import update_urls

from ._mixins import PurgeImageCacheMixin

__all__ = [
    "ReservationUnitImage",
]


class ReservationUnitImage(models.Model, PurgeImageCacheMixin):
    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        related_name="images",
        on_delete=models.CASCADE,
    )

    image: ThumbnailFile | None = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT, null=True)
    image_type: str = models.CharField(max_length=20, choices=ReservationUnitImageType.choices)

    large_url: str = models.URLField(max_length=255, default="", blank=True)
    medium_url: str = models.URLField(max_length=255, default="", blank=True)
    small_url: str = models.URLField(max_length=255, default="", blank=True)

    class Meta:
        db_table = "reservation_unit_image"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return f"{self.reservation_unit.name} ({self.get_image_type_display()})"

    def save(self, *args: Any, **kwargs: Any) -> None:
        self.purge_previous_image_cache()
        super().save(*args, **kwargs)
        update_urls.delay(self.pk)
