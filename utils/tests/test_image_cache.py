from unittest import mock

from assertpy import assert_that
from django.test import override_settings
from django.test.testcases import TestCase
from pytest import raises

from utils import image_cache


@override_settings(
    IMAGE_CACHE_ENABLED=True,
    IMAGE_CACHE_VARNISH_HOST="https://test.url",
    IMAGE_CACHE_PURGE_KEY="test-purge-key",
    IMAGE_CACHE_HOST_HEADER="test.tilavaraus.url",
)
class ImageCacheTestCase(TestCase):
    @override_settings(IMAGE_CACHE_ENABLED=False)
    @mock.patch("utils.image_cache.urljoin")
    def test_purge_no_action_if_disabled(self, urljoin):
        image_cache.purge("foo/bar.jpg")
        assert_that(urljoin.called).is_false()

    @override_settings(IMAGE_CACHE_VARNISH_HOST=None)
    def test_purge_error_if_cache_root_url_missing(self):
        with raises(image_cache.ImageCacheConfigurationError) as err:
            image_cache.purge("foo/bar.jpg")

        assert_that(str(err.value)).is_equal_to(
            "IMAGE_CACHE_VARNISH_HOST or IMAGE_CACHE_PURGE_KEY setting is not configured"
        )

    @override_settings(IMAGE_CACHE_PURGE_KEY=None)
    def test_purge_error_if_cache_purge_key_missing(self):
        with raises(image_cache.ImageCacheConfigurationError) as err:
            image_cache.purge("foo/bar.jpg")

        assert_that(str(err.value)).is_equal_to(
            "IMAGE_CACHE_VARNISH_HOST or IMAGE_CACHE_PURGE_KEY setting is not configured"
        )

    @mock.patch("utils.image_cache.capture_message")
    @mock.patch("utils.image_cache.request")
    def test_purge_makes_correct_request(self, request, capture_message):
        request.return_value = mock.MagicMock(status_code=200)
        image_cache.purge("foo/bar.jpg")
        request.assert_called_with(
            "PURGE",
            "https://test.url/foo/bar.jpg",
            headers={"X-VC-Purge-Key": "test-purge-key", "Host": "test.tilavaraus.url"},
        )
        assert_that(capture_message.called).is_false()

    @mock.patch("utils.image_cache.capture_message")
    @mock.patch("utils.image_cache.request")
    def test_purge_logs_failed_requests(self, request, capture_message):
        request.return_value = mock.MagicMock(status_code=400)

        image_cache.purge("foo/bar.jpg")
        assert_that(capture_message.called).is_true()
