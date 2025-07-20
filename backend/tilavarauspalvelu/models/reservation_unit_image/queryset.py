from __future__ import annotations

from easy_thumbnails.exceptions import InvalidImageFormatError

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import ReservationUnitImage
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitImageManager",
    "ReservationUnitImageQuerySet",
]


class ReservationUnitImageQuerySet(ModelQuerySet[ReservationUnitImage]):
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


class ReservationUnitImageManager(ModelManager[ReservationUnitImage, ReservationUnitImageQuerySet]): ...
