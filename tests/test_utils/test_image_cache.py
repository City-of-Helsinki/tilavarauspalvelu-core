from unittest import mock

import pytest
from django.test import override_settings

from tests.helpers import patch_method
from utils import image_cache
from utils.sentry import SentryLogger


@mock.patch("utils.image_cache.urljoin")
def test_image_cache_purge__no_action_if_disabled(urljoin):
    image_cache.purge("foo/bar.jpg")
    assert urljoin.called is False


@override_settings(IMAGE_CACHE_ENABLED=True, IMAGE_CACHE_VARNISH_HOST="")
def test_image_cache_purge__error_if_cache_root_url_missing():
    with pytest.raises(image_cache.ImageCacheConfigurationError) as err:
        image_cache.purge("foo/bar.jpg")

    assert str(err.value) == "IMAGE_CACHE_VARNISH_HOST setting is not configured"


@override_settings(IMAGE_CACHE_ENABLED=True, IMAGE_CACHE_PURGE_KEY="")
def test_image_cache_purge__error_if_cache_purge_key_missing():  # NOSONAR python:S4144
    with pytest.raises(image_cache.ImageCacheConfigurationError) as err:
        image_cache.purge("foo/bar.jpg")

    assert str(err.value) == "IMAGE_CACHE_PURGE_KEY setting is not configured"


@override_settings(IMAGE_CACHE_ENABLED=True)
@patch_method(SentryLogger.log_message)
@mock.patch("utils.image_cache.request")
def test_image_cache_purge__makes_correct_request(request):
    request.return_value = mock.MagicMock(status_code=200)
    image_cache.purge("foo/bar.jpg")
    request.assert_called_with(
        "PURGE",
        "https://fake.test.url/foo/bar.jpg",
        headers={"X-VC-Purge-Key": "test-purge-key", "Host": "test.tilavaraus.url"},
        timeout=60,
    )
    assert SentryLogger.log_message.called is False


@override_settings(IMAGE_CACHE_ENABLED=True)
@patch_method(SentryLogger.log_message)
@mock.patch("utils.image_cache.request")
def test_image_cache_purge__logs_failed_requests(request):
    request.return_value = mock.MagicMock(status_code=400)

    image_cache.purge("foo/bar.jpg")
    assert SentryLogger.log_message.call_count == 1
