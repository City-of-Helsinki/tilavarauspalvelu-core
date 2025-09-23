from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from easy_thumbnails.exceptions import InvalidImageFormatError

from tilavarauspalvelu.integrations.sentry import SentryLogger

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitImage

__all__ = [
    "ReservationUnitImageManager",
    "ReservationUnitImageQuerySet",
]


class ReservationUnitImageQuerySet(models.QuerySet):
    def update_thumbnail_urls(self) -> None:
        reservation_unit_images = self.filter(image__isnull=False)

        images: list[ReservationUnitImage] = list(reservation_unit_images)
        if not images:
            return

        for image in images:
            try:
                image.large_url = image.image["large"].url
                image.medium_url = image.image["medium"].url
                image.small_url = image.image["small"].url
            except InvalidImageFormatError as err:
                SentryLogger.log_exception(
                    err,
                    details="Unable to update image urls",
                    reservation_unit_image_id=image.pk,
                )

        self.bulk_update(images, ["large_url", "medium_url", "small_url"])


class ReservationUnitImageManager(models.Manager.from_queryset(ReservationUnitImageQuerySet)): ...
