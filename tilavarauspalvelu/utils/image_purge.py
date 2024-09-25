from django.conf import settings
from django.db import models
from easy_thumbnails.files import get_thumbnailer

from tilavarauspalvelu.tasks import purge_image_cache


def purge_previous_image_cache(instance: models.Model) -> None:
    previous_data = instance.__class__.objects.filter(pk=instance.pk).first()
    if settings.IMAGE_CACHE_ENABLED and previous_data and previous_data.image:
        aliases = settings.THUMBNAIL_ALIASES[""]
        for conf_key in list(aliases.keys()):
            image_path = get_thumbnailer(previous_data.image)[conf_key].url
            purge_image_cache.delay(image_path)
