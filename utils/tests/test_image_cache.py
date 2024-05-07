from unittest import mock

import pytest
from django.test import override_settings
from django.test.testcases import TestCase

from tests.helpers import patch_method
from utils import image_cache
from utils.sentry import SentryLogger


class ImageCacheTestCase(TestCase):
    @mock.patch("utils.image_cache.urljoin")
    def test_purge_no_action_if_disabled(self, urljoin):
        image_cache.purge("foo/bar.jpg")
        assert urljoin.called is False

    @override_settings(IMAGE_CACHE_ENABLED=True, IMAGE_CACHE_VARNISH_HOST="")
    def test_purge_error_if_cache_root_url_missing(self):
        with pytest.raises(image_cache.ImageCacheConfigurationError) as err:
            image_cache.purge("foo/bar.jpg")

        assert str(err.value) == "IMAGE_CACHE_VARNISH_HOST setting is not configured"

    @override_settings(IMAGE_CACHE_ENABLED=True, IMAGE_CACHE_PURGE_KEY="")
    def test_purge_error_if_cache_purge_key_missing(self):  # NOSONAR python:S4144
        with pytest.raises(image_cache.ImageCacheConfigurationError) as err:
            image_cache.purge("foo/bar.jpg")

        assert str(err.value) == "IMAGE_CACHE_PURGE_KEY setting is not configured"

    @override_settings(IMAGE_CACHE_ENABLED=True)
    @patch_method(SentryLogger.log_message)
    @mock.patch("utils.image_cache.request")
    def test_purge_makes_correct_request(self, request):
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
    def test_purge_logs_failed_requests(self, request):
        request.return_value = mock.MagicMock(status_code=400)

        image_cache.purge("foo/bar.jpg")
        assert SentryLogger.log_message.called is True
