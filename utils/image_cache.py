from urllib.parse import urljoin

from django.conf import settings
from django.db import models
from easy_thumbnails.files import get_thumbnailer
from requests import request
from rest_framework.status import HTTP_200_OK

from tilavarauspalvelu.tasks import purge_image_cache
from utils.sentry import SentryLogger


class ImageCacheConfigurationError(Exception):
    pass


def purge_previous_image_cache(instance: models.Model) -> None:
    previous_data = instance.__class__.objects.filter(pk=instance.pk).first()
    if previous_data and previous_data.image:
        aliases = settings.THUMBNAIL_ALIASES[""]
        for conf_key in list(aliases.keys()):
            image_path = get_thumbnailer(previous_data.image)[conf_key].url
            purge_image_cache.delay(image_path)


def purge(path: str) -> None:
    if not settings.IMAGE_CACHE_ENABLED:
        return

    if not settings.IMAGE_CACHE_VARNISH_HOST:
        msg = "IMAGE_CACHE_VARNISH_HOST setting is not configured"
        raise ImageCacheConfigurationError(msg)
    if not settings.IMAGE_CACHE_PURGE_KEY:
        msg = "IMAGE_CACHE_PURGE_KEY setting is not configured"
        raise ImageCacheConfigurationError(msg)

    full_url = urljoin(settings.IMAGE_CACHE_VARNISH_HOST, path)

    response = request(
        "PURGE",
        full_url,
        headers={
            "X-VC-Purge-Key": settings.IMAGE_CACHE_PURGE_KEY,
            "Host": settings.IMAGE_CACHE_HOST_HEADER,
        },
        timeout=60,
    )

    if response.status_code != HTTP_200_OK:
        SentryLogger.log_message(
            message="Purging an image cache failed",
            details=f"Purging an image cache failed with status code {response.status_code}. "
            f"Check image cache configuration.",
            level="error",
        )
