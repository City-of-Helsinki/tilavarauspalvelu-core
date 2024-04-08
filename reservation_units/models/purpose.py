from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

from ._mixins import PurgeImageCacheMixin

__all__ = [
    "Purpose",
]


class Purpose(models.Model, PurgeImageCacheMixin):
    name = models.CharField(max_length=200)

    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_PURPOSE_IMAGES_ROOT, null=True)

    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

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

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs) -> None:
        self.purge_previous_image_cache()
        super().save(*args, **kwargs)
