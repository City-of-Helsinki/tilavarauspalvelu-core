from django.conf import settings
from django.db import models
from easy_thumbnails.fields import ThumbnailerImageField
from easy_thumbnails.files import ThumbnailFile

from ._mixins import PurgeImageCacheMixin

__all__ = [
    "Purpose",
]


class Purpose(models.Model, PurgeImageCacheMixin):
    name = models.CharField(max_length=200)

    image: ThumbnailFile | None = ThumbnailerImageField(
        upload_to=settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT,
        null=True,
    )

    rank: int | None = models.PositiveIntegerField(blank=True, null=True)

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    class Meta:
        db_table = "purpose"
        base_manager_name = "objects"
        ordering = [
            "rank",
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        self.purge_previous_image_cache()
        super().save(*args, **kwargs)
