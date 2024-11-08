from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

from tilavarauspalvelu.enums import ReservationUnitImageType

from .queryset import ReservationUnitImageManager

if TYPE_CHECKING:
    from easy_thumbnails.files import ThumbnailerImageFieldFile

    from tilavarauspalvelu.models import ReservationUnit

    from .actions import ReservationUnitImageActions

__all__ = [
    "ReservationUnitImage",
]


class ReservationUnitImage(models.Model):
    reservation_unit: ReservationUnit = models.ForeignKey(
        "tilavarauspalvelu.ReservationUnit",
        related_name="images",
        on_delete=models.CASCADE,
    )

    image: ThumbnailerImageFieldFile | None
    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT, null=True)
    image_type: str = models.CharField(max_length=20, choices=ReservationUnitImageType.choices)

    large_url: str = models.URLField(max_length=255, default="", blank=True)
    medium_url: str = models.URLField(max_length=255, default="", blank=True)
    small_url: str = models.URLField(max_length=255, default="", blank=True)

    objects = ReservationUnitImageManager()

    class Meta:
        db_table = "reservation_unit_image"
        base_manager_name = "objects"
        verbose_name = _("reservation unit image")
        verbose_name_plural = _("reservation unit images")
        ordering = ["pk"]

    def __str__(self) -> str:
        return f"{self.reservation_unit.name} ({self.get_image_type_display()})"

    @cached_property
    def actions(self) -> ReservationUnitImageActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitImageActions

        return ReservationUnitImageActions(self)
