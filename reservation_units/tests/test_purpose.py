from io import BytesIO
from unittest import mock

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.test.testcases import TestCase
from easy_thumbnails.files import get_thumbnailer
from PIL import Image

from reservation_units.tests.factories import PurposeFactory


class PurposeTestCase(TestCase):
    @mock.patch("reservation_units.models.purge_image_cache.delay")
    @override_settings(IMAGE_CACHE_ENABLED=True)
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_image_purge_on_save(self, purge):
        mock_image_data = BytesIO()
        mock_image = Image.new("RGB", (100, 100))
        mock_image.save(fp=mock_image_data, format="PNG")
        mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

        purpose = PurposeFactory(name="test purpose", image=mock_file)
        purpose.save()

        aliases = settings.THUMBNAIL_ALIASES[""]
        for conf_key in list(aliases.keys()):
            image_path = get_thumbnailer(purpose.image)[conf_key].url
            purge.assert_any_call(image_path)
