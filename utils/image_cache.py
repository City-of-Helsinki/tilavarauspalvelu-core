from urllib.parse import urljoin

from django.conf import settings
from requests import request

from utils.sentry import SentryLogger


class ImageCacheConfigurationError(Exception):
    pass


def purge(path: str) -> None:
    if not settings.IMAGE_CACHE_ENABLED:
        return

    if not settings.IMAGE_CACHE_VARNISH_HOST:
        raise ImageCacheConfigurationError("IMAGE_CACHE_VARNISH_HOST setting is not configured")
    if not settings.IMAGE_CACHE_PURGE_KEY:
        raise ImageCacheConfigurationError("IMAGE_CACHE_PURGE_KEY setting is not configured")

    full_url = urljoin(settings.IMAGE_CACHE_VARNISH_HOST, path)

    response = request(
        "PURGE",
        full_url,
        headers={
            "X-VC-Purge-Key": settings.IMAGE_CACHE_PURGE_KEY,
            "Host": settings.IMAGE_CACHE_HOST_HEADER,
        },
    )

    if response.status_code != 200:
        SentryLogger.log_message(
            message="Purging an image cache failed",
            details=f"Purging an image cache failed with status code {response.status_code}. "
            f"Check image cache configuration.",
            level="error",
        )
