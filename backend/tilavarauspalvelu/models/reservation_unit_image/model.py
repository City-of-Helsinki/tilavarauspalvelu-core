from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import ReservationUnitImageType
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from lazy_managers import LazyAttribute

    from .actions import ReservationUnitImageActions
    from .queryset import ReservationUnitImageManager
    from .validators import ReservationUnitImageValidator

__all__ = [
    "ReservationUnitImage",
]


class ReservationUnitImage(models.Model):
    reservation_unit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="images",
        on_delete=models.CASCADE,
    )

    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT, null=True, blank=True)
    image_type: ReservationUnitImageType = TextChoicesField(enum=ReservationUnitImageType)  # type: ignore[assignment]

    large_url = models.URLField(max_length=255, default="", blank=True)
    medium_url = models.URLField(max_length=255, default="", blank=True)
    small_url = models.URLField(max_length=255, default="", blank=True)

    objects: ClassVar[ReservationUnitImageManager] = LazyModelManager.new()
    actions: LazyAttribute[ReservationUnitImageActions] = LazyModelAttribute.new()
    validators: LazyAttribute[ReservationUnitImageValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_image"
        base_manager_name = "objects"
        verbose_name = _("reservation unit image")
        verbose_name_plural = _("reservation unit images")
        ordering = ["image_type"]

    def __str__(self) -> str:
        return f"{self.reservation_unit.name} ({self.image_type})"
