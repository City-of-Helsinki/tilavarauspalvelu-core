from urllib.parse import urljoin

from django.conf import settings
from requests import request
from sentry_sdk import capture_message


class ImageCacheConfigurationError(Exception):
    pass


def purge(path: str) -> None:
    if not settings.IMAGE_CACHE_ENABLED:
        return

    if not settings.IMAGE_CACHE_ROOT_URL or not settings.IMAGE_CACHE_PURGE_KEY:
        raise ImageCacheConfigurationError(
            "IMAGE_CACHE_ROOT_URL or IMAGE_CACHE_PURGE_KEY setting is not configured"
        )

    full_url = urljoin(settings.IMAGE_CACHE_ROOT_URL, path)

    response = request(
        "PURGE",
        full_url,
        headers={
            "X-VC-Purge-Key": settings.IMAGE_CACHE_PURGE_KEY,
        },
    )

    if response.status_code != 200:
        capture_message(
            f"Purging an image cache failed with status code {response.status_code}. Check image cache configuration.",
            level="error",
        )
