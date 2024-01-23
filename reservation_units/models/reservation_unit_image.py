from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from easy_thumbnails.fields import ThumbnailerImageField

from reservation_units.tasks import update_urls

from ._mixins import PurgeImageCacheMixin

__all__ = [
    "ReservationUnitImage",
]


class ReservationUnitImage(models.Model, PurgeImageCacheMixin):
    TYPES = (
        ("main", _("Main image")),
        ("ground_plan", _("Ground plan")),
        ("map", _("Map")),
        ("other", _("Other")),
    )

    image_type = models.CharField(max_length=20, verbose_name=_("Type"), choices=TYPES)

    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        verbose_name=_("Reservation unit image"),
        related_name="images",
        on_delete=models.CASCADE,
    )

    image = ThumbnailerImageField(upload_to=settings.RESERVATION_UNIT_IMAGES_ROOT, null=True)

    large_url = models.URLField(null=False, blank=True, max_length=255, default="")
    medium_url = models.URLField(null=False, blank=True, max_length=255, default="")
    small_url = models.URLField(null=False, blank=True, max_length=255, default="")

    class Meta:
        db_table = "reservation_unit_image"
        base_manager_name = "objects"

    def __str__(self):
        return f"{self.reservation_unit.name} ({self.get_image_type_display()})"

    def save(
        self,
        force_insert=False,
        force_update=False,
        using=None,
        update_fields=None,
        update_urls=True,
    ):
        self.purge_previous_image_cache()

        super().save(force_insert=force_insert, force_update=force_update, using=using, update_fields=update_fields)

        if update_urls:
            self.update_image_urls()

    def update_image_urls(self):
        update_urls.delay(self.pk)
