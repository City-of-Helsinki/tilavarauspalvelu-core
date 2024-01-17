from django.conf import settings
from django.db import models
from easy_thumbnails.files import get_thumbnailer

from reservation_units.tasks import purge_image_cache


class PurgeImageCacheMixin:
    def purge_previous_image_cache(self: models.Model) -> None:
        previous_data = self.__class__.objects.filter(pk=self.pk).first()
        if settings.IMAGE_CACHE_ENABLED and previous_data and previous_data.image:
            aliases = settings.THUMBNAIL_ALIASES[""]
            for conf_key in list(aliases.keys()):
                image_path = get_thumbnailer(previous_data.image)[conf_key].url
                purge_image_cache.delay(image_path)
