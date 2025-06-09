from __future__ import annotations

from urllib.parse import urljoin

from django.conf import settings
from requests import request
from rest_framework.status import HTTP_200_OK

from tilavarauspalvelu.integrations.sentry import SentryLogger


class ImageCacheConfigurationError(Exception):
    pass


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
